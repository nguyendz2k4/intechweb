import assert from 'node:assert/strict'
import { createHmac, randomBytes } from 'node:crypto'
import { test } from 'node:test'
import {
  adminCookieName,
  authenticateAdmin,
  createAdminSession,
  currentAdminSessionCount,
  decryptAdminTotp,
  encryptAdminTotp,
  getAdminSession,
  requireAdmin,
} from '../app/lib/admin-auth'
import {
  changeCredential,
  loadCredential,
  pendingMfa,
  revokeSession,
} from '../app/lib/admin-auth-store'
import { GET as securityInfo, POST as securityAction } from '../app/api/admin/auth/security/route'
import { POST as login } from '../app/api/admin/auth/login/route'
let username = 'qa-owner'
const password = 'test-only-current-password-123'
const envKeys = [
  'NODE_ENV',
  'DATABASE_URL',
  'ADMIN_USER',
  'ADMIN_PASSWORD',
  'ADMIN_SESSION_SECRET',
  'ADMIN_CREDENTIAL_ENCRYPTION_KEY',
  'ADMIN_ACCOUNTS_JSON',
  'ADMIN_TRUSTED_ORIGINS',
  'ADMIN_ENABLED',
  'RATE_LIMIT_BACKEND',
]
async function configured(run: () => Promise<void>) {
  username = 'qa-owner-' + randomBytes(6).toString('hex')
  const previous = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]))
  for (const key of envKeys) delete process.env[key]
  Object.assign(process.env, {
    NODE_ENV: 'test',
    ADMIN_USER: username,
    ADMIN_PASSWORD: password,
    ADMIN_SESSION_SECRET: randomBytes(48).toString('base64url'),
    ADMIN_CREDENTIAL_ENCRYPTION_KEY: randomBytes(48).toString('base64url'),
    ADMIN_TRUSTED_ORIGINS: 'http://localhost:3000',
    RATE_LIMIT_BACKEND: 'memory',
  })
  try {
    await run()
  } finally {
    for (const [key, value] of Object.entries(previous))
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
  }
}
function request(token?: string, body?: object, endpoint = 'security') {
  return new Request(`http://localhost:3000/api/admin/auth/${endpoint}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      origin: 'http://localhost:3000',
      'content-type': 'application/json',
      ...(token ? { cookie: `${adminCookieName()}=${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}
function totp(secret: string, counter = Math.floor(Date.now() / 30000)) {
  let value = 0,
    bits = 0
  const bytes = []
  for (const char of secret) {
    value = (value << 5) | 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(char)
    bits += 5
    if (bits >= 8) {
      bits -= 8
      bytes.push((value >>> bits) & 255)
    }
  }
  const message = Buffer.alloc(8)
  message.writeBigUInt64BE(BigInt(counter))
  const digest = createHmac('sha1', Buffer.from(bytes)).update(message).digest(),
    offset = digest[digest.length - 1] & 15
  return String((digest.readUInt32BE(offset) & 0x7fffffff) % 1000000).padStart(6, '0')
}
test('server sessions support individual revocation and self-service revoke-all with password verification', () =>
  configured(async () => {
    const first = await createAdminSession(username),
      second = await createAdminSession(username)
    assert.equal((await securityInfo(request())).status, 401)
    const info = await (await securityInfo(request(first.token))).json()
    assert.equal(info.activeSessions, 2)
    assert.equal(info.mfaEnabled, false)
    assert.equal(JSON.stringify(info).includes(password), false)
    await revokeSession(first.token)
    assert.equal(await getAdminSession(request(first.token)), null)
    assert.ok(await getAdminSession(request(second.token)))
    assert.equal(
      (await securityAction(request(second.token, { action: 'revoke-all', password: 'wrong' })))
        .status,
      400,
    )
    assert.ok(await getAdminSession(request(second.token)))
    assert.equal(
      (await securityAction(request(second.token, { action: 'revoke-all', password }))).status,
      200,
    )
    assert.equal(await getAdminSession(request(second.token)), null)
  }))
test('self-service password change invalidates every old cookie and overrides initial env password', () =>
  configured(async () => {
    const first = await createAdminSession(username),
      second = await createAdminSession(username)
    const newPassword = 'new-password-with-twelve-plus-characters'
    const response = await securityAction(
      request(first.token, { action: 'password', password, newPassword }),
    )
    assert.equal(response.status, 200)
    assert.match(response.headers.get('set-cookie')!, /Max-Age=0/)
    assert.equal(await getAdminSession(request(first.token)), null)
    assert.equal(await getAdminSession(request(second.token)), null)
    assert.equal(await authenticateAdmin(username, password, ''), null)
    assert.ok(await authenticateAdmin(username, newPassword, ''))
    const credential = await loadCredential(username)
    assert.match(credential.passwordHash!, /^scrypt\$/)
    assert.equal(JSON.stringify(credential).includes(newPassword), false)
  }))
test('MFA enrollment is session-bound, validates a real code, encrypts secrets and blocks enrollment-code replay', () =>
  configured(async () => {
    const first = await createAdminSession(username),
      second = await createAdminSession(username)
    const begin = await securityAction(request(first.token, { action: 'mfa-begin', password }))
    assert.equal(begin.status, 200)
    const setup = await begin.json()
    assert.match(setup.secret, /^[A-Z2-7]{32}$/)
    assert.equal((await loadCredential(username)).totpEncrypted, null)
    assert.equal(await pendingMfa(second.token), null)
    const encrypted = await pendingMfa(first.token)
    assert.ok(encrypted)
    assert.equal(encrypted.includes(setup.secret), false)
    const code = totp(setup.secret)
    assert.equal(
      (await securityAction(request(second.token, { action: 'mfa-confirm', password, code })))
        .status,
      409,
    )
    assert.equal(
      (
        await securityAction(
          request(first.token, { action: 'mfa-confirm', password, code: 'abcdef' }),
        )
      ).status,
      400,
    )
    assert.equal(
      (await securityAction(request(first.token, { action: 'mfa-confirm', password, code })))
        .status,
      200,
    )
    assert.equal(await getAdminSession(request(first.token)), null)
    assert.equal(await getAdminSession(request(second.token)), null)
    const stored = await loadCredential(username)
    assert.equal(decryptAdminTotp(username, stored.totpEncrypted!), setup.secret)
    assert.equal(await authenticateAdmin(username, password, ''), null)
    assert.equal(
      (await login(request(undefined, { username: username, password, code }, 'login'))).status,
      401,
    )
    const nextCode = totp(setup.secret, Math.floor(Date.now() / 30000) + 1)
    assert.equal(
      (await login(request(undefined, { username: username, password, code: nextCode }, 'login')))
        .status,
      200,
    )
  }))
test('MFA ciphertext authenticates username and encryption key; storage/key failure closes access', () =>
  configured(async () => {
    const encrypted = encryptAdminTotp(username, 'A'.repeat(32))
    assert.equal(decryptAdminTotp(username, encrypted), 'A'.repeat(32))
    assert.throws(() => decryptAdminTotp('other-owner', encrypted))
    process.env.ADMIN_CREDENTIAL_ENCRYPTION_KEY = 'other-test-key-at-least-thirty-two-characters'
    assert.throws(() => decryptAdminTotp(username, encrypted))
    const session = await createAdminSession(username)
    process.env.DATABASE_URL = 'not-a-database-url'
    assert.equal((await requireAdmin(request(session.token)))?.status, 503)
  }))

test('secret-store password and MFA rotations invalidate sessions even with durable overrides', () =>
  configured(async () => {
    const hash = `scrypt$131072$8$1$${'a'.repeat(22)}$${'b'.repeat(86)}`
    await changeCredential(username, 'initial', {
      passwordHash: hash,
      totpEncrypted: encryptAdminTotp(username, 'A'.repeat(32)),
    })
    const passwordSession = await createAdminSession(username)
    process.env.ADMIN_PASSWORD = `${password}-rotated`
    assert.equal(await getAdminSession(request(passwordSession.token)), null)
    assert.equal(await currentAdminSessionCount(username), 0)
    delete process.env.ADMIN_USER
    delete process.env.ADMIN_PASSWORD
    process.env.ADMIN_ACCOUNTS_JSON = JSON.stringify([
      { username, role: 'admin', passwordHash: hash, totpSecret: 'B'.repeat(32) },
    ])
    const mfaSession = await createAdminSession(username)
    assert.ok(await getAdminSession(request(mfaSession.token)))
    process.env.ADMIN_ACCOUNTS_JSON = JSON.stringify([
      { username, role: 'admin', passwordHash: hash, totpSecret: 'C'.repeat(32) },
    ])
    assert.equal(await getAdminSession(request(mfaSession.token)), null)
    assert.equal(await currentAdminSessionCount(username), 0)
  }))
