import assert from 'node:assert/strict'
import { createHmac, randomBytes, scryptSync } from 'node:crypto'
import { test } from 'node:test'
import { POST as login } from '../app/api/admin/auth/login/route'
import {
  adminCookieName,
  adminEnrollmentCookieName,
  createAdminSession,
  requireAdmin,
  validateAdminRequest,
  verifyAdminSession,
} from '../app/lib/admin-auth'
import { loadCredential, loadMfaEnrollment, revokeSession } from '../app/lib/admin-auth-store'

const password = 'fixture-login-password'
const salt = randomBytes(16)
const hash = `scrypt$131072$8$1$${salt.toString('base64url')}$${scryptSync(password, salt, 64, { N: 131072, r: 8, p: 1, maxmem: 160 * 1024 * 1024 }).toString('base64url')}`
const keys = [
  'NODE_ENV',
  'DATABASE_URL',
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'ADMIN_ENABLED',
  'ADMIN_ACCOUNTS_JSON',
  'ADMIN_SESSION_SECRET',
  'ADMIN_CREDENTIAL_ENCRYPTION_KEY',
  'ADMIN_TRUSTED_ORIGINS',
  'ADMIN_SESSION_TTL_SECONDS',
  'RATE_LIMIT_BACKEND',
  'RATE_LIMIT_TRUSTED_IP_HEADER',
]
let username = ''
async function configured(run: () => Promise<void>) {
  const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
  for (const key of keys) delete process.env[key]
  username = `enroll-${randomBytes(6).toString('hex')}@example.test`
  Object.assign(process.env, {
    NODE_ENV: 'test',
    ADMIN_SESSION_SECRET: randomBytes(48).toString('base64url'),
    ADMIN_CREDENTIAL_ENCRYPTION_KEY: randomBytes(48).toString('base64url'),
    ADMIN_TRUSTED_ORIGINS: 'http://localhost:3000',
    RATE_LIMIT_BACKEND: 'memory',
    ADMIN_ACCOUNTS_JSON: JSON.stringify([
      { username, role: 'admin', passwordHash: hash, requireMfaSetup: true },
    ]),
  })
  try {
    await run()
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}
function request(body: object, cookie = '', origin = 'http://localhost:3000') {
  return new Request('http://localhost:3000/api/admin/auth/login', {
    method: 'POST',
    headers: { host: 'localhost:3000', origin, 'content-type': 'application/json', cookie },
    body: JSON.stringify(body),
  })
}
function otp(secret: string, counter = Math.floor(Date.now() / 30000)) {
  let bits = 0,
    value = 0
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
  const digest = createHmac('sha1', Buffer.from(bytes)).update(message).digest()
  return String(
    (digest.readUInt32BE(digest[digest.length - 1] & 15) & 0x7fffffff) % 1_000_000,
  ).padStart(6, '0')
}
async function begin(cookie = '') {
  const response = await login(request({ username, password }, cookie))
  assert.equal(response.status, 200)
  const body = await response.json()
  assert.equal(body.step, 'mfa-setup')
  assert.match(body.secret, /^[A-Z2-7]{32}$/)
  const setupCookie = response.headers.get('set-cookie')!.split(';')[0]
  assert.ok(setupCookie.startsWith(`${adminEnrollmentCookieName()}=`))
  return { response, body, cookie: setupCookie, token: setupCookie.split('=')[1] }
}

test('setup needs the correct password, same origin, and no admin access is issued before confirmation', () =>
  configured(async () => {
    const failed = await login(request({ username, password: 'wrong-password' }))
    assert.equal(failed.status, 401)
    assert.ok(!JSON.stringify(await failed.json()).includes('secret'))
    assert.equal(
      (await login(request({ username, password }, '', 'https://other.example.test'))).status,
      403,
    )
    const setup = await begin()
    assert.equal(setup.response.headers.get('cache-control'), 'no-store')
    assert.match(setup.response.headers.get('set-cookie')!, /HttpOnly/)
    assert.match(setup.response.headers.get('set-cookie')!, /SameSite=Strict/)
    assert.equal(await verifyAdminSession(setup.token), null)
    assert.equal(
      (
        await requireAdmin(
          new Request('http://localhost:3000/admin', { headers: { cookie: setup.cookie } }),
        )
      )?.status,
      401,
    )
    await assert.rejects(createAdminSession(username), /MFA setup must be confirmed/)
    const repeat = await begin(setup.cookie)
    assert.equal(repeat.body.secret, setup.body.secret)
    assert.equal(repeat.token, setup.token)
    const pending = await loadMfaEnrollment(setup.token)
    assert.ok(pending)
    assert.ok(!pending.encrypted.includes(setup.body.secret))
    const bad = await login(request({ action: 'mfa-confirm', code: 'not-otp' }, setup.cookie))
    assert.equal(bad.status, 400)
    assert.equal((await loadCredential(username)).totpEncrypted, null)
  }))

test('first valid OTP enrolls once; later logins keep the key, require OTP and reject replay', () =>
  configured(async () => {
    const setup = await begin()
    const counter = Math.floor(Date.now() / 30000)
    const firstCode = otp(setup.body.secret, counter)
    const confirmed = await login(request({ action: 'mfa-confirm', code: firstCode }, setup.cookie))
    assert.equal(confirmed.status, 200, JSON.stringify(await confirmed.clone().json()))
    const session = await confirmed.json()
    assert.equal(session.username, username)
    assert.ok(!JSON.stringify(session).includes(setup.body.secret))
    const cookie = confirmed.headers.get('set-cookie')!.split(';')[0]
    const token = cookie.slice(`${adminCookieName()}=`.length)
    assert.equal((await verifyAdminSession(token))?.username, username)
    const credential = await loadCredential(username)
    assert.ok(credential.totpEncrypted)
    await revokeSession(token)
    assert.equal(await verifyAdminSession(token), null)
    const passwordOnly = await login(request({ username, password }))
    assert.equal(passwordOnly.status, 200)
    assert.deepEqual(await passwordOnly.json(), { step: 'mfa-required' })
    assert.equal(passwordOnly.headers.get('set-cookie'), null)
    const replay = await login(request({ username, password, code: firstCode }))
    assert.equal(replay.status, 401)
    const next = await login(
      request({ username, password, code: otp(setup.body.secret, counter + 1) }),
    )
    assert.equal(next.status, 200)
    assert.deepEqual(await loadCredential(username), credential)
    assert.equal(
      (await login(request({ action: 'mfa-confirm', code: firstCode }, setup.cookie))).status,
      401,
    )
    // Even retaining the enrollment bootstrap flag cannot reopen setup after DB enrollment.
    const again = await login(request({ username, password }, setup.cookie))
    assert.deepEqual(await again.json(), { step: 'mfa-required' })
  }))

test('confirmation requires the original unexpired enrollment cookie and rejects wrong codes', () =>
  configured(async () => {
    const setup = await begin()
    assert.equal(
      (await login(request({ action: 'mfa-confirm', code: otp(setup.body.secret) }))).status,
      401,
    )
    const fake = `${adminEnrollmentCookieName()}=${randomBytes(32).toString('base64url')}`
    assert.equal(
      (await login(request({ action: 'mfa-confirm', code: otp(setup.body.secret) }, fake))).status,
      401,
    )
    const valid = otp(setup.body.secret)
    const invalid = valid === '123456' ? '654321' : '123456'
    assert.equal(
      (await login(request({ action: 'mfa-confirm', code: invalid }, setup.cookie))).status,
      401,
    )
    assert.equal((await loadCredential(username)).totpEncrypted, null)
    const original = Date.now
    try {
      Date.now = () => original() + 601_000
      assert.equal(
        (await login(request({ action: 'mfa-confirm', code: valid }, setup.cookie))).status,
        401,
      )
    } finally {
      Date.now = original
    }
  }))

test('two concurrent setup attempts cannot replace the winning MFA key', () =>
  configured(async () => {
    const first = await begin(),
      second = await begin()
    const results = await Promise.all([
      login(request({ action: 'mfa-confirm', code: otp(first.body.secret) }, first.cookie)),
      login(request({ action: 'mfa-confirm', code: otp(second.body.secret) }, second.cookie)),
    ])
    assert.equal(results.filter((r) => r.status === 200).length, 1)
    assert.ok(results.every((r) => [200, 401, 409].includes(r.status)))
    const winner = results[0].status === 200 ? first : second
    const cookie = results
      .find((r) => r.status === 200)!
      .headers.get('set-cookie')!
      .split(';')[0]
    assert.equal((await verifyAdminSession(cookie.split('=')[1]))?.username, username)
    assert.equal((await login(request({ username, password }))).status, 200)
    const code = otp(winner.body.secret, Math.floor(Date.now() / 30000) + 1)
    assert.equal((await login(request({ username, password, code }))).status, 200)
  }))

test('production accepts explicit first-time setup and rejects an unprotected account configuration', () =>
  configured(async () => {
    Object.assign(process.env, { NODE_ENV: 'production' })
    process.env.ADMIN_TRUSTED_ORIGINS = 'https://intechna.vn'
    const req = new Request('https://intechna.vn/api/admin/auth/login', {
      headers: { host: 'intechna.vn' },
    })
    assert.equal(validateAdminRequest(req), null)
    process.env.ADMIN_ACCOUNTS_JSON = JSON.stringify([
      { username, role: 'admin', passwordHash: hash },
    ])
    assert.equal(validateAdminRequest(req)?.status, 503)
  }))

test('setup confirmation attempts are limited per account', () =>
  configured(async () => {
    const setup = await begin()
    const valid = otp(setup.body.secret)
    const invalid = valid === '123456' ? '654321' : '123456'
    for (let i = 0; i < 5; i++)
      assert.equal(
        (await login(request({ action: 'mfa-confirm', code: invalid }, setup.cookie))).status,
        401,
      )
    const blocked = await login(request({ action: 'mfa-confirm', code: valid }, setup.cookie))
    assert.equal(blocked.status, 429)
    assert.equal((await loadCredential(username)).totpEncrypted, null)
  }))
