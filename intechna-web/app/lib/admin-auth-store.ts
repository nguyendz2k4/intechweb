import { databaseConfigured, getMysqlDatabase } from './db/mysql-client.mjs'
import { createHash, randomBytes } from 'node:crypto'
import { ApiError } from './api-security'

export type Credential = {
  passwordHash: string | null
  totpEncrypted: string | null
  revision: string
}
type StoredSession = {
  username: string
  version: string
  expiresAt: number
  pending?: string
  pendingExpiresAt?: number
}
const credentials = new Map<string, Credential>()
const sessions = new Map<string, StoredSession>()
// Memory exists only for isolated unit tests/development without a configured DB.
function connection() {
  if (databaseConfigured()) return getMysqlDatabase()
  if (process.env.NODE_ENV === 'production')
    throw new Error('Persistent authentication storage unavailable')
  return null
}
function memoryKey(value: string) {
  return `${process.env.ADMIN_SESSION_SECRET}:${value}`
}
export function tokenHash(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function loadCredential(username: string): Promise<Credential> {
  const sql = connection()
  if (!sql)
    return (
      credentials.get(memoryKey(username)) ?? {
        passwordHash: null,
        totpEncrypted: null,
        revision: 'initial',
      }
    )
  const rows = await sql.query<Credential>(
    'SELECT password_hash AS passwordHash, totp_encrypted AS totpEncrypted, revision FROM security_admin_credentials WHERE username=?',
    [username],
  )
  return (
    (rows[0] as Credential | undefined) ?? {
      passwordHash: null,
      totpEncrypted: null,
      revision: 'initial',
    }
  )
}

export async function storeSession(
  token: string,
  username: string,
  version: string,
  expiresAt: number,
  revision: string,
) {
  const sql = connection(),
    hash = tokenHash(token)
  if (!sql) {
    if ((credentials.get(memoryKey(username))?.revision ?? 'initial') !== revision)
      throw new ApiError('Thông tin tài khoản vừa thay đổi. Vui lòng đăng nhập lại.', 409)
    sessions.set(memoryKey(hash), { username, version, expiresAt })
    return
  }
  await sql.transaction(async (tx) => {
    const current = await lockCredential(tx, username)
    if (current.revision !== revision)
      throw new ApiError('Thông tin tài khoản vừa thay đổi. Vui lòng đăng nhập lại.', 409)
    await tx.execute(
      'INSERT INTO security_admin_sessions (token_hash, username, version, expires_at) VALUES (?, ?, ?, ?)',
      [hash, username, version, new Date(expiresAt * 1000)],
    )
  })
}

export async function activeSession(token: string, version: string, now: number) {
  const sql = connection(),
    hash = tokenHash(token)
  if (!sql) {
    const row = sessions.get(memoryKey(hash))
    return !!row && row.version === version && row.expiresAt > now
  }
  const rows = await sql.query(
    'SELECT 1 FROM security_admin_sessions WHERE token_hash=? AND version=? AND expires_at > ? AND expires_at > UTC_TIMESTAMP(3)',
    [hash, version, new Date(now * 1000)],
  )
  return rows.length === 1
}

export async function revokeSession(token: string) {
  const sql = connection(),
    hash = tokenHash(token)
  if (!sql) {
    sessions.delete(memoryKey(hash))
    return
  }
  await sql.execute('DELETE FROM security_admin_sessions WHERE token_hash=?', [hash])
}
export async function revokeSessions(username: string) {
  const sql = connection()
  if (!sql) {
    for (const [key, row] of sessions)
      if (row.username === username && key.startsWith(`${process.env.ADMIN_SESSION_SECRET}:`))
        sessions.delete(key)
    return
  }
  await sql.execute('DELETE FROM security_admin_sessions WHERE username=?', [username])
}
export async function sessionCount(username: string, version?: string) {
  const sql = connection()
  if (!sql)
    return [...sessions.entries()].filter(
      ([key, row]) =>
        key.startsWith(`${process.env.ADMIN_SESSION_SECRET}:`) &&
        row.username === username &&
        (version === undefined || row.version === version) &&
        row.expiresAt > Date.now() / 1000,
    ).length
  const rows = await sql.query<{ count: number }>(
    'SELECT count(*) AS count FROM security_admin_sessions WHERE username=? AND expires_at > UTC_TIMESTAMP(3)' +
      (version === undefined ? '' : ' AND version=?'),
    version === undefined ? [username] : [username, version],
  )
  return Number(rows[0].count)
}

export async function changeCredential(
  username: string,
  expectedRevision: string,
  fields: Omit<Credential, 'revision'>,
) {
  const sql = connection(),
    revision = randomBytes(24).toString('base64url')
  if (!sql) {
    if ((credentials.get(memoryKey(username))?.revision ?? 'initial') !== expectedRevision)
      throw new ApiError('Tài khoản vừa thay đổi. Vui lòng đăng nhập lại.', 409)
    credentials.set(memoryKey(username), { ...fields, revision })
    await revokeSessions(username)
    return revision
  }
  return changeCredentialWithDatabase(sql, username, expectedRevision, fields, revision)
}

/** A failed credential CAS must not revoke sessions belonging to the newer revision. */
export async function changeCredentialWithDatabase(
  sql: ReturnType<typeof getMysqlDatabase>,
  username: string,
  expectedRevision: string,
  fields: Omit<Credential, 'revision'>,
  revision = randomBytes(24).toString('base64url'),
) {
  await sql.transaction(async (tx) => {
    const current = await lockCredential(tx, username)
    if (current.revision !== expectedRevision)
      throw new ApiError('Tài khoản vừa thay đổi. Vui lòng đăng nhập lại.', 409)
    await tx.execute(
      'UPDATE security_admin_credentials SET password_hash=?, totp_encrypted=?, revision=?, updated_at=UTC_TIMESTAMP(3) WHERE username=?',
      [fields.passwordHash, fields.totpEncrypted, revision, username],
    )
    await tx.execute('DELETE FROM security_admin_sessions WHERE username=?', [username])
  })
  return revision
}
/** Login and credential changes serialize on the same row, including the initial revision. */
async function lockCredential(
  tx: Parameters<Parameters<ReturnType<typeof getMysqlDatabase>['transaction']>[0]>[0],
  username: string,
) {
  await tx.execute(
    "INSERT INTO security_admin_credentials (username, revision) VALUES (?, 'initial') ON DUPLICATE KEY UPDATE username=VALUES(username)",
    [username],
  )
  const rows = await tx.query<Credential>(
    'SELECT password_hash AS passwordHash, totp_encrypted AS totpEncrypted, revision FROM security_admin_credentials WHERE username=? FOR UPDATE',
    [username],
  )
  if (!rows[0]) throw new Error('Credential storage unavailable')
  return rows[0]
}
export async function pendingMfa(token: string, encrypted?: string) {
  const sql = connection(),
    hash = tokenHash(token),
    expiry = Math.floor(Date.now() / 1000) + 600
  if (!sql) {
    const row = sessions.get(memoryKey(hash))
    if (!row || row.expiresAt <= Date.now() / 1000)
      throw new ApiError('Phiên đăng nhập đã hết hạn.', 401)
    if (encrypted) {
      row.pending = encrypted
      row.pendingExpiresAt = expiry
    }
    return row.pendingExpiresAt && row.pendingExpiresAt > Date.now() / 1000
      ? (row.pending ?? null)
      : null
  }
  if (encrypted)
    await sql.execute(
      'UPDATE security_admin_sessions SET pending_totp=?, pending_expires_at=? WHERE token_hash=? AND expires_at > UTC_TIMESTAMP(3)',
      [encrypted, new Date(expiry * 1000), hash],
    )
  const rows = await sql.query<{ pending_totp: string | null }>(
    'SELECT pending_totp FROM security_admin_sessions WHERE token_hash=? AND expires_at > UTC_TIMESTAMP(3) AND pending_expires_at > UTC_TIMESTAMP(3)',
    [hash],
  )
  return (rows[0]?.pending_totp as string | undefined) ?? null
}

/** Pending enrollment tokens are opaque, never signed admin session tokens. */
export async function loadMfaEnrollment(token: string) {
  if (!/^[A-Za-z0-9_-]{43}$/.test(token)) return null
  const sql = connection(),
    hash = tokenHash(token),
    now = Date.now() / 1000
  if (!sql) {
    const row = sessions.get(memoryKey(hash))
    if (
      !row?.pending ||
      row.expiresAt <= now ||
      !row.pendingExpiresAt ||
      row.pendingExpiresAt <= now
    )
      return null
    return {
      username: row.username,
      version: row.version,
      encrypted: row.pending,
      expiresAt: row.expiresAt,
    }
  }
  const rows = await sql.query<{
    username: string
    version: string
    encrypted: string
    expiresAt: number
  }>(
    'SELECT username, version, pending_totp AS encrypted, UNIX_TIMESTAMP(expires_at) AS expiresAt FROM security_admin_sessions WHERE token_hash=? AND pending_totp IS NOT NULL AND expires_at > UTC_TIMESTAMP(3) AND pending_expires_at > UTC_TIMESTAMP(3)',
    [hash],
  )
  return rows[0] ?? null
}
