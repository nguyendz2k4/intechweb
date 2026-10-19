import {
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  randomBytes,
  scrypt,
  timingSafeEqual,
} from 'node:crypto'
import {
  activeSession,
  changeCredential,
  loadCredential,
  loadMfaEnrollment,
  pendingMfa,
  sessionCount,
  storeSession,
} from './admin-auth-store'
import { consumeAdminTotp } from './admin-auth-replay'
import { ApiError } from './api-security'

export type AdminRole = 'admin' | 'editor' | 'support'
export type AdminPermission =
  | 'products:read'
  | 'products:write'
  | 'posts:read'
  | 'posts:write'
  | 'services:read'
  | 'services:write'
  | 'warranty:read'
  | 'warranty:write'
  | 'contacts:read'
  | 'contacts:write'
  | 'uploads:write'

const rolePermissions: Record<AdminRole, AdminPermission[]> = {
  admin: [
    'products:read',
    'products:write',
    'posts:read',
    'posts:write',
    'services:read',
    'services:write',
    'warranty:read',
    'warranty:write',
    'contacts:read',
    'contacts:write',
    'uploads:write',
  ],
  editor: [
    'products:read',
    'products:write',
    'posts:read',
    'posts:write',
    'services:read',
    'services:write',
    'uploads:write',
  ],
  support: ['warranty:read', 'warranty:write', 'contacts:read', 'contacts:write'],
}

export type AdminSession = {
  username: string
  role: AdminRole
  permissions: AdminPermission[]
  expiresAt: number
}

type AdminAccount = {
  username: string
  passwordHash: string
  role: AdminRole
  totpSecret?: string
  environmentPassword?: string
  revision?: string
  bootstrapVersion?: string
  requireMfaSetup?: boolean
  mfaDisabled?: true
}

type AdminConfig = {
  secret: string
  accounts: AdminAccount[]
  ttl: number
  origins: string[]
  mfaRequired: boolean
}
type TokenPayload = {
  sub: string
  role: AdminRole
  iat: number
  exp: number
  version: string
  nonce: string
}

const usernamePattern = /^[a-zA-Z0-9][a-zA-Z0-9_.@-]{2,79}$/
const passwordHashPattern = /^scrypt\$131072\$8\$1\$([A-Za-z0-9_-]{22})\$([A-Za-z0-9_-]{86})$/
const unsafeMethods = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function adminCookieName() {
  return process.env.NODE_ENV === 'production'
    ? '__Host-intech_admin_session'
    : 'intech_admin_session'
}

function safeEqual(left: string, right: string) {
  // Hash first so both comparison inputs always have the same length.
  return timingSafeEqual(
    createHash('sha256').update(left).digest(),
    createHash('sha256').update(right).digest(),
  )
}

function decodeBase32(value: string): Buffer | null {
  const normalized = value.replace(/\s/g, '').toUpperCase().replace(/=+$/, '')
  if (!/^[A-Z2-7]{32,128}$/.test(normalized)) return null
  let bits = 0
  let accumulator = 0
  const bytes: number[] = []
  for (const letter of normalized) {
    accumulator = (accumulator << 5) | 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'.indexOf(letter)
    bits += 5
    if (bits >= 8) {
      bits -= 8
      bytes.push((accumulator >>> bits) & 255)
    }
  }
  return Buffer.from(bytes)
}

function getConfig(): AdminConfig | null {
  if (process.env.ADMIN_ENABLED === 'false') return null
  if (
    process.env.ADMIN_MFA_REQUIRED !== undefined &&
    !['true', 'false'].includes(process.env.ADMIN_MFA_REQUIRED)
  )
    return null
  const mfaRequired = adminMfaRequired()
  const secret = process.env.ADMIN_SESSION_SECRET ?? ''
  if (Buffer.byteLength(secret) < 32) return null
  if (
    mfaRequired &&
    process.env.NODE_ENV === 'production' &&
    Buffer.byteLength(process.env.ADMIN_CREDENTIAL_ENCRYPTION_KEY ?? '') < 32
  )
    return null
  let origins: string[] = []
  try {
    origins = (process.env.ADMIN_TRUSTED_ORIGINS ?? '')
      .split(',')
      .filter(Boolean)
      .map((value) => {
        const url = new URL(value.trim())
        if (url.username || url.password || url.pathname !== '/' || url.search || url.hash)
          throw new Error('Invalid origin')
        if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:')
          throw new Error('HTTPS required')
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol')
        return url.origin
      })
  } catch {
    return null
  }
  if (process.env.NODE_ENV === 'production' && origins.length === 0) return null
  const ttlValue = Number(process.env.ADMIN_SESSION_TTL_SECONDS ?? 3_600)
  if (!Number.isInteger(ttlValue) || ttlValue < 900 || ttlValue > 86_400) return null
  let accounts: AdminAccount[] = []
  // Explicit password-only mode uses simple cPanel variables, even if legacy JSON is malformed.
  if (!mfaRequired && (process.env.ADMIN_USER || process.env.ADMIN_PASSWORD)) {
    const username = process.env.ADMIN_USER ?? '',
      password = process.env.ADMIN_PASSWORD ?? ''
    if (!usernamePattern.test(username) || password.length < 8 || password.length > 256) return null
    accounts = [
      {
        username,
        passwordHash: '',
        role: 'admin',
        environmentPassword: password,
        mfaDisabled: true,
      },
    ]
  } else if (process.env.ADMIN_ACCOUNTS_JSON) {
    try {
      const input: unknown = JSON.parse(process.env.ADMIN_ACCOUNTS_JSON)
      if (!Array.isArray(input) || input.length === 0 || input.length > 20) return null
      const seen = new Set<string>()
      for (const raw of input) {
        if (!raw || typeof raw !== 'object') return null
        const { username, passwordHash, role, totpSecret, requireMfaSetup } = raw as Record<
          string,
          unknown
        >
        if (typeof username !== 'string' || !usernamePattern.test(username) || seen.has(username))
          return null
        if (typeof passwordHash !== 'string' || !passwordHashPattern.test(passwordHash)) return null
        if (role !== 'admin' && role !== 'editor' && role !== 'support') return null
        if (
          mfaRequired &&
          totpSecret !== undefined &&
          (typeof totpSecret !== 'string' || !decodeBase32(totpSecret))
        )
          return null
        if (mfaRequired && requireMfaSetup !== undefined && requireMfaSetup !== true) return null
        if (mfaRequired && requireMfaSetup === true && totpSecret !== undefined) return null
        if (
          mfaRequired &&
          process.env.NODE_ENV === 'production' &&
          !totpSecret &&
          requireMfaSetup !== true
        )
          return null
        accounts.push({
          username,
          passwordHash,
          role,
          totpSecret: mfaRequired ? (totpSecret as string | undefined) : undefined,
          ...(mfaRequired && requireMfaSetup === true ? { requireMfaSetup: true } : {}),
          ...(!mfaRequired ? { mfaDisabled: true as const } : {}),
        })
        seen.add(username)
      }
    } catch {
      return null
    }
  } else if (process.env.NODE_ENV !== 'production') {
    const username = process.env.ADMIN_USER ?? ''
    const password = process.env.ADMIN_PASSWORD ?? ''
    if (!usernamePattern.test(username) || password.length < 12) return null
    accounts = [{ username, passwordHash: '', role: 'admin', environmentPassword: password }]
  }
  if (accounts.length === 0) return null
  return { secret, accounts, ttl: ttlValue, origins, mfaRequired }
}

export function adminMfaRequired() {
  return process.env.ADMIN_MFA_REQUIRED !== 'false'
}

function authResponse(status: number, error: string) {
  return Response.json(
    { error },
    { status, headers: { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' } },
  )
}

/** Host allowlist and same-origin checks apply to login, logout, and every protected API. */
export function validateAdminRequest(request: Request): Response | null {
  const config = getConfig()
  if (!config)
    return authResponse(503, 'Quản trị chưa được cấu hình an toàn. Liên hệ người vận hành.')
  const url = new URL(request.url)
  const host = (request.headers.get('host') || url.host).toLowerCase()
  const trustedOrigins = config.origins.length ? config.origins : [url.origin]
  if (!trustedOrigins.some((origin) => new URL(origin).host.toLowerCase() === host))
    return authResponse(403, 'Tên miền quản trị không được phép.')
  if (unsafeMethods.has(request.method.toUpperCase())) {
    if (request.headers.get('sec-fetch-site') === 'cross-site')
      return authResponse(403, 'Yêu cầu khác nguồn bị từ chối.')
    const origin = request.headers.get('origin')
    if (
      !origin ||
      !trustedOrigins.includes(origin) ||
      new URL(origin).host.toLowerCase() !== host
    ) {
      return authResponse(403, 'Yêu cầu phải được gửi từ cùng nguồn quản trị.')
    }
  }
  return null
}

function accountVersion(account: AdminAccount, secret: string) {
  return createHmac('sha256', secret).update(JSON.stringify(account)).digest('base64url')
}

function credentialKey() {
  const value = process.env.ADMIN_CREDENTIAL_ENCRYPTION_KEY ?? ''
  if (Buffer.byteLength(value) < 32) throw new Error('Credential encryption key unavailable')
  return createHash('sha256').update(value).digest()
}
export function encryptAdminTotp(username: string, secret: string) {
  const iv = randomBytes(12),
    cipher = createCipheriv('aes-256-gcm', credentialKey(), iv)
  cipher.setAAD(Buffer.from(username))
  const encrypted = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()])
  return [
    'v1',
    iv.toString('base64url'),
    cipher.getAuthTag().toString('base64url'),
    encrypted.toString('base64url'),
  ].join('.')
}
export function decryptAdminTotp(username: string, encrypted: string) {
  const [version, iv, tag, body, extra] = encrypted.split('.')
  if (version !== 'v1' || extra || !iv || !tag || !body)
    throw new Error('Invalid encrypted credential')
  const cipher = createDecipheriv('aes-256-gcm', credentialKey(), Buffer.from(iv, 'base64url'))
  cipher.setAAD(Buffer.from(username))
  cipher.setAuthTag(Buffer.from(tag, 'base64url'))
  const value = Buffer.concat([
    cipher.update(Buffer.from(body, 'base64url')),
    cipher.final(),
  ]).toString('utf8')
  if (!decodeBase32(value)) throw new Error('Invalid MFA credential')
  return value
}
async function effectiveAccount(base: AdminAccount): Promise<AdminAccount> {
  const credential = await loadCredential(base.username)
  return {
    ...base,
    passwordHash: credential.passwordHash ?? base.passwordHash,
    environmentPassword: credential.passwordHash ? undefined : base.environmentPassword,
    totpSecret: base.mfaDisabled
      ? undefined
      : credential.totpEncrypted
        ? decryptAdminTotp(base.username, credential.totpEncrypted)
        : base.totpSecret,
    revision: credential.revision,
    // A secret-store rotation also invalidates sessions after self-service overrides.
    bootstrapVersion: accountVersion(base, process.env.ADMIN_SESSION_SECRET ?? ''),
  }
}

export async function createAdminSession(
  username: string,
  now = Math.floor(Date.now() / 1000),
  expectedVersion?: string,
): Promise<{ token: string; session: AdminSession }> {
  const config = getConfig()
  const base = config?.accounts.find((candidate) => candidate.username === username)
  if (!config || !base) throw new Error('Admin authentication is not configured')
  const account = await effectiveAccount(base)
  if (config.mfaRequired && account.requireMfaSetup && !account.totpSecret)
    throw new Error('MFA setup must be confirmed before creating an admin session')
  const version = accountVersion(account, config.secret)
  if (expectedVersion && !safeEqual(version, expectedVersion))
    throw new Error('Credentials changed during authentication')
  const payload: TokenPayload = {
    sub: account.username,
    role: account.role,
    iat: now,
    exp: now + config.ttl,
    version,
    nonce: randomBytes(24).toString('base64url'),
  }
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const signature = createHmac('sha256', config.secret).update(encoded).digest('base64url')
  const token = `${encoded}.${signature}`
  await storeSession(token, username, version, payload.exp, account.revision!)
  return {
    token,
    session: {
      username: account.username,
      role: account.role,
      permissions: [...rolePermissions[account.role]],
      expiresAt: payload.exp,
    },
  }
}

export async function verifyAdminSession(
  token: string,
  now = Math.floor(Date.now() / 1000),
): Promise<AdminSession | null> {
  const config = getConfig()
  if (!config || token.length > 4096) return null
  const parts = token.split('.')
  if (
    parts.length !== 2 ||
    !/^[A-Za-z0-9_-]+$/.test(parts[0]) ||
    !/^[A-Za-z0-9_-]{43}$/.test(parts[1])
  )
    return null
  const expected = createHmac('sha256', config.secret).update(parts[0]).digest('base64url')
  if (!safeEqual(parts[1], expected)) return null
  try {
    const payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8')) as TokenPayload
    if (
      !Number.isInteger(payload.iat) ||
      !Number.isInteger(payload.exp) ||
      payload.exp <= now ||
      payload.iat > now + 30 ||
      payload.exp - payload.iat > config.ttl ||
      payload.exp <= payload.iat
    )
      return null
    if (typeof payload.nonce !== 'string' || !/^[A-Za-z0-9_-]{32}$/.test(payload.nonce)) return null
    const base = config.accounts.find((candidate) => candidate.username === payload.sub)
    const account = base ? await effectiveAccount(base) : null
    if (
      !account ||
      (account.requireMfaSetup && !account.totpSecret) ||
      account.role !== payload.role ||
      typeof payload.version !== 'string' ||
      !safeEqual(payload.version, accountVersion(account, config.secret))
    )
      return null
    if (!(await activeSession(token, payload.version, now))) return null
    return {
      username: account.username,
      role: account.role,
      permissions: [...rolePermissions[account.role]],
      expiresAt: payload.exp,
    }
  } catch (error) {
    // Malformed tokens are handled above. Persistence/key failures must close access.
    if (error instanceof SyntaxError) return null
    throw error
  }
}

export function adminRequestToken(request: Request): string | null {
  const cookie = request.headers.get('cookie') ?? ''
  const name = adminCookieName()
  const matching = cookie
    .split(';')
    .map((item) => item.trim())
    .filter((item) => item.startsWith(`${name}=`))
  if (matching.length !== 1) return null
  return matching[0].slice(name.length + 1)
}

export async function getAdminSession(request: Request): Promise<AdminSession | null> {
  const token = adminRequestToken(request)
  return token ? verifyAdminSession(token) : null
}

/** Every admin route calls this itself; proxy authentication is only the first gate. */
export async function requireAdmin(
  request: Request,
  permission?: AdminPermission,
): Promise<Response | null> {
  const requestError = validateAdminRequest(request)
  if (requestError) return requestError
  let session: AdminSession | null
  try {
    session = await getAdminSession(request)
  } catch {
    return authResponse(503, 'Hệ thống xác thực tạm thời chưa khả dụng. Vui lòng thử lại.')
  }
  if (!session) return authResponse(401, 'Vui lòng đăng nhập quản trị.')
  if (permission && !session.permissions.includes(permission))
    return authResponse(403, 'Tài khoản không có quyền thực hiện thao tác này.')
  return null
}

async function verifyPassword(password: string, account?: AdminAccount): Promise<boolean> {
  if (account?.environmentPassword !== undefined && process.env.NODE_ENV !== 'production')
    return safeEqual(password, account.environmentPassword)
  // Always run scrypt for unknown users to avoid a username-existence timing oracle.
  const match = account ? passwordHashPattern.exec(account.passwordHash) : null
  const salt = match ? Buffer.from(match[1], 'base64url') : Buffer.alloc(16)
  const key = await new Promise<Buffer>((resolve, reject) => {
    scrypt(
      password,
      salt,
      64,
      { N: 131072, r: 8, p: 1, maxmem: 160 * 1024 * 1024 },
      (error, result) => (error ? reject(error) : resolve(result)),
    )
  })
  if (account?.environmentPassword !== undefined)
    return safeEqual(password, account.environmentPassword)
  return Boolean(match && timingSafeEqual(key, Buffer.from(match[2], 'base64url')))
}

export async function hashAdminPassword(password: string) {
  const salt = randomBytes(16)
  const key = await new Promise<Buffer>((resolve, reject) =>
    scrypt(
      password,
      salt,
      64,
      { N: 131072, r: 8, p: 1, maxmem: 160 * 1024 * 1024 },
      (error, result) => (error ? reject(error) : resolve(result)),
    ),
  )
  return `scrypt$131072$8$1$${salt.toString('base64url')}$${key.toString('base64url')}`
}
export function generateAdminTotp() {
  let bits = 0,
    value = 0,
    result = ''
  for (const byte of randomBytes(20)) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      bits -= 5
      result += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[(value >>> bits) & 31]
    }
  }
  return result
}

/** Returns the matched 30-second counter, allowing a small clock drift. */
export function matchTotpCounter(
  secret: string,
  code: string,
  now = Math.floor(Date.now() / 1000),
): number | null {
  const key = decodeBase32(secret)
  if (!key || !/^\d{6}$/.test(code)) return null
  const current = Math.floor(now / 30)
  for (const counter of [current, current - 1, current + 1]) {
    const message = Buffer.alloc(8)
    message.writeBigUInt64BE(BigInt(counter))
    const digest = createHmac('sha1', key).update(message).digest()
    const offset = digest[digest.length - 1] & 15
    const value = (digest.readUInt32BE(offset) & 0x7fffffff) % 1_000_000
    if (safeEqual(code, String(value).padStart(6, '0'))) return counter
  }
  return null
}

export type AdminLoginProof = {
  username: string
  version: string
  revision: string
}

export async function beginAdminLogin(
  username: string,
  password: string,
  code: string,
): Promise<
  | (
      | (AdminLoginProof & {
          step: 'authenticated'
          totpCounter: number | null
          replayIdentity: string
        })
      | (AdminLoginProof & { step: 'mfa-setup' })
      | (AdminLoginProof & { step: 'mfa-required' })
    )
  | null
> {
  const config = getConfig()
  if (!config) return null
  const base = config.accounts.find((candidate) => safeEqual(candidate.username, username))
  // Keep the same persistence lookup for unknown usernames before the same scrypt work.
  if (!base) await loadCredential(username)
  const account = base ? await effectiveAccount(base) : undefined
  if (!(await verifyPassword(password, account)) || !account) return null
  const proof = {
    username: account.username,
    version: accountVersion(account, config.secret),
    revision: account.revision!,
  }
  if (account.requireMfaSetup && !account.totpSecret) return { ...proof, step: 'mfa-setup' }
  if (account.totpSecret && !code) return { ...proof, step: 'mfa-required' }
  const totpCounter = account.totpSecret ? matchTotpCounter(account.totpSecret, code) : null
  if (account.totpSecret && totpCounter === null) return null
  return {
    ...proof,
    step: 'authenticated',
    totpCounter,
    replayIdentity: createHmac('sha256', config.secret)
      .update(`${account.username}:${account.totpSecret ?? ''}`)
      .digest('hex'),
  }
}

/** Full authentication never accepts a password-only enrollment proof. */
export async function authenticateAdmin(username: string, password: string, code: string) {
  const result = await beginAdminLogin(username, password, code)
  return result?.step === 'authenticated' ? result : null
}

function enrollmentVersion(version: string, secret: string) {
  return createHmac('sha256', secret).update(`mfa-enrollment:${version}`).digest('hex')
}

export function adminEnrollmentCookieName() {
  return process.env.NODE_ENV === 'production' ? '__Host-intech_admin_setup' : 'intech_admin_setup'
}

export function adminEnrollmentRequestToken(request: Request) {
  const name = adminEnrollmentCookieName()
  const cookies = (request.headers.get('cookie') ?? '')
    .split(';')
    .map((value) => value.trim())
    .filter((value) => value.startsWith(`${name}=`))
  if (cookies.length !== 1) return ''
  const token = cookies[0].slice(name.length + 1)
  return /^[A-Za-z0-9_-]{43}$/.test(token) ? token : ''
}

export function adminEnrollmentCookie(token = '') {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  return `${adminEnrollmentCookieName()}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${token ? 600 : 0}${secure}`
}

async function enrollmentContext(token: string) {
  const config = getConfig()
  if (!config?.mfaRequired) return null
  const pending = await loadMfaEnrollment(token)
  if (!pending) return null
  const base = config.accounts.find((candidate) => candidate.username === pending.username)
  if (!base?.requireMfaSetup) return null
  const account = await effectiveAccount(base)
  // Once confirmed, password-only requests can never reveal or replace the active key.
  if (
    account.totpSecret ||
    !safeEqual(
      pending.version,
      enrollmentVersion(accountVersion(account, config.secret), config.secret),
    )
  )
    return null
  return { config, account, pending }
}

export async function adminEnrollmentUsername(token: string) {
  return (await enrollmentContext(token))?.account.username ?? null
}

export async function beginAdminEnrollment(proof: AdminLoginProof, existingToken = '') {
  const config = getConfig(),
    base = config?.accounts.find((candidate) => candidate.username === proof.username)
  if (!config?.mfaRequired || !base?.requireMfaSetup)
    throw new ApiError('Thiết lập xác thực không khả dụng.', 409)
  const account = await effectiveAccount(base)
  if (account.totpSecret || !safeEqual(proof.version, accountVersion(account, config.secret)))
    throw new ApiError('Thông tin tài khoản vừa thay đổi. Vui lòng đăng nhập lại.', 409)
  const existing = existingToken ? await enrollmentContext(existingToken) : null
  if (existing && existing.account.username === proof.username) {
    return {
      token: existingToken,
      secret: decryptAdminTotp(proof.username, existing.pending.encrypted),
      expiresIn: Math.max(1, Math.floor(existing.pending.expiresAt - Date.now() / 1000)),
    }
  }
  const token = randomBytes(32).toString('base64url'),
    secret = generateAdminTotp()
  await storeSession(
    token,
    account.username,
    enrollmentVersion(proof.version, config.secret),
    Math.floor(Date.now() / 1000) + 600,
    proof.revision,
  )
  await pendingMfa(token, encryptAdminTotp(account.username, secret))
  return { token, secret, expiresIn: 600 }
}

export async function confirmAdminEnrollment(token: string, code: string) {
  const context = await enrollmentContext(token)
  if (!context)
    throw new ApiError('Phiên thiết lập đã hết hạn hoặc đã hoàn tất. Vui lòng đăng nhập lại.', 401)
  const { config, account, pending } = context
  const secret = decryptAdminTotp(account.username, pending.encrypted)
  const counter = matchTotpCounter(secret, code)
  if (counter === null)
    throw new ApiError('Mã xác thực chưa đúng. Vui lòng nhập mã mới từ ứng dụng.', 401)
  if (!(await consumeAdminTotp(adminTotpReplayIdentity(account.username, secret), counter)))
    throw new ApiError('Mã xác thực đã được sử dụng. Vui lòng chờ mã tiếp theo.', 401)
  // CAS and row locking make concurrent enrollment attempts single-winner.
  const revision = await changeCredential(account.username, account.revision!, {
    passwordHash: account.passwordHash,
    totpEncrypted: pending.encrypted,
  })
  const version = accountVersion(
    {
      ...account,
      passwordHash: account.passwordHash,
      totpSecret: secret,
      environmentPassword: undefined,
      revision,
    },
    config.secret,
  )
  return createAdminSession(account.username, undefined, version)
}

export async function adminMfaEnabled(username: string) {
  const base = getConfig()?.accounts.find((candidate) => candidate.username === username)
  if (!base) throw new Error('Unknown admin account')
  return Boolean((await effectiveAccount(base)).totpSecret)
}

export async function currentAdminSessionCount(username: string) {
  const config = getConfig(),
    base = config?.accounts.find((account) => account.username === username)
  if (!config || !base) throw new Error('Unknown admin account')
  return sessionCount(username, accountVersion(await effectiveAccount(base), config.secret))
}

export async function assertAdminCredentialVersion(username: string, version: string) {
  const config = getConfig(),
    base = config?.accounts.find((account) => account.username === username)
  if (
    !config ||
    !base ||
    !safeEqual(accountVersion(await effectiveAccount(base), config.secret), version)
  )
    throw new Error('Credentials changed during authentication')
}

export function adminTotpReplayIdentity(username: string, secret: string) {
  const config = getConfig()
  if (!config) throw new Error('Admin configuration unavailable')
  return createHmac('sha256', config.secret).update(`${username}:${secret}`).digest('hex')
}

export function adminSessionCookie(token: string, expiresAt: number) {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : ''
  const maxAge = Math.max(0, expiresAt - Math.floor(Date.now() / 1000))
  return `${adminCookieName()}=${token}; HttpOnly; Path=/; SameSite=Strict; Max-Age=${maxAge}; Expires=${new Date(expiresAt * 1000).toUTCString()}${secure}`
}

export function clearAdminSessionCookie() {
  return `${adminCookieName()}=; HttpOnly; Path=/; SameSite=Strict; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`
}
