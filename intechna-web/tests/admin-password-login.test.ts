import assert from 'node:assert/strict'
import { randomBytes } from 'node:crypto'
import { test } from 'node:test'
import { POST as login } from '../app/api/admin/auth/login/route'
import { GET as securityInfo, POST as securityAction } from '../app/api/admin/auth/security/route'
import { POST as logout } from '../app/api/admin/auth/logout/route'
import {
  adminCookieName,
  hashAdminPassword,
  requireAdmin,
  validateAdminRequest,
  verifyAdminSession,
} from '../app/lib/admin-auth'
import { changeCredential, loadCredential } from '../app/lib/admin-auth-store'
import { diagnoseAdminEnvironment } from '../scripts/admin-config-diagnostics.mjs'

const password = 'Fixture@123'
const keys = [
  'NODE_ENV',
  'DATABASE_URL',
  'DB_HOST',
  'DB_NAME',
  'DB_USER',
  'ADMIN_ENABLED',
  'ADMIN_MFA_REQUIRED',
  'ADMIN_USER',
  'ADMIN_PASSWORD',
  'ADMIN_SESSION_SECRET',
  'ADMIN_CREDENTIAL_ENCRYPTION_KEY',
  'ADMIN_TRUSTED_ORIGINS',
  'ADMIN_SESSION_TTL_SECONDS',
  'ADMIN_ACCOUNTS_JSON',
  'RATE_LIMIT_BACKEND',
  'RATE_LIMIT_TRUSTED_IP_HEADER',
]
let username = '',
  ipIndex = 1
async function configured(run: () => Promise<void>) {
  const saved = Object.fromEntries(keys.map((key) => [key, process.env[key]]))
  for (const key of keys) delete process.env[key]
  username = `password-owner-${randomBytes(6).toString('hex')}@example.test`
  ipIndex++
  Object.assign(process.env, {
    NODE_ENV: 'test',
    ADMIN_ENABLED: 'true',
    ADMIN_MFA_REQUIRED: 'false',
    ADMIN_USER: username,
    ADMIN_PASSWORD: password,
    ADMIN_SESSION_SECRET: randomBytes(48).toString('base64url'),
    ADMIN_TRUSTED_ORIGINS: 'http://localhost:3000',
    ADMIN_ACCOUNTS_JSON: 'broken legacy JSON',
    RATE_LIMIT_BACKEND: 'memory',
    RATE_LIMIT_TRUSTED_IP_HEADER: 'x-test-ip',
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
function request(endpoint = 'login', body?: object, cookie = '') {
  return new Request(`http://localhost:3000/api/admin/auth/${endpoint}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      host: 'localhost:3000',
      origin: 'http://localhost:3000',
      'content-type': 'application/json',
      'x-test-ip': `192.0.2.${ipIndex}`,
      cookie,
    },
    body: body ? JSON.stringify(body) : undefined,
  })
}
async function signIn() {
  const response = await login(request('login', { username, password }))
  assert.equal(response.status, 200)
  const payload = await response.json()
  assert.equal(payload.username, username)
  assert.equal(payload.role, 'admin')
  assert.ok(!('step' in payload) && !('secret' in payload))
  const cookie = response.headers.get('set-cookie')!.split(';')[0]
  assert.ok(cookie.startsWith(`${adminCookieName()}=`))
  return { cookie, token: cookie.slice(`${adminCookieName()}=`.length) }
}

test('password-only configuration works on production without MFA, JSON, or encryption key', () =>
  configured(async () => {
    Object.assign(process.env, {
      NODE_ENV: 'production',
      ADMIN_TRUSTED_ORIGINS: 'https://intechna.vn',
    })
    const req = new Request('https://intechna.vn/admin-login', { headers: { host: 'intechna.vn' } })
    assert.equal(validateAdminRequest(req), null)
    assert.equal(diagnoseAdminEnvironment(process.env).ready, true)
    assert.equal(diagnoseAdminEnvironment(process.env).authenticationMode, 'password')
    process.env.ADMIN_SESSION_SECRET = 'short'
    assert.equal(validateAdminRequest(req)?.status, 503)
  }))

test('password-only login issues a normal protected session and logout revokes it', () =>
  configured(async () => {
    const { cookie, token } = await signIn()
    assert.equal((await verifyAdminSession(token))?.username, username)
    assert.equal(
      await requireAdmin(new Request('http://localhost:3000/admin', { headers: { cookie } })),
      null,
    )
    const info = await securityInfo(request('security', undefined, cookie))
    const data = await info.json()
    assert.equal(data.mfaEnabled, false)
    assert.equal(data.mfaRequired, false)
    assert.equal((await loadCredential(username)).totpEncrypted, null)
    assert.equal((await logout(request('logout', {}, cookie))).status, 200)
    assert.equal(await verifyAdminSession(token), null)
    await signIn()
  }))

test('password-only login still rejects wrong credentials, cross-origin requests and excess attempts', () =>
  configured(async () => {
    const otherOrigin = new Request('http://localhost:3000/api/admin/auth/login', {
      method: 'POST',
      headers: { origin: 'https://other.example.test', 'content-type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    assert.equal((await login(otherOrigin)).status, 403)
    assert.equal(
      (await login(request('login', { username: 'unknown@example.test', password }))).status,
      401,
    )
    for (let i = 0; i < 5; i++)
      assert.equal(
        (await login(request('login', { username, password: 'wrong-password' }))).status,
        401,
      )
    assert.equal((await login(request('login', { username, password }))).status, 429)
  }))

test('old encrypted MFA cannot block password-only login, and MFA setup actions remain disabled', () =>
  configured(async () => {
    await changeCredential(username, 'initial', {
      passwordHash: null,
      totpEncrypted: 'unreadable-old-mfa-ciphertext',
    })
    const { cookie } = await signIn()
    const before = await loadCredential(username)
    for (const action of ['mfa-begin', 'mfa-confirm']) {
      const response = await securityAction(
        request('security', { action, password, code: '123456' }, cookie),
      )
      assert.equal(response.status, 400)
    }
    assert.deepEqual(await loadCredential(username), before)
    const nextPassword = 'fixture-new-password-12345'
    const changed = await securityAction(
      request('security', { action: 'password', password, newPassword: nextPassword }, cookie),
    )
    assert.equal(changed.status, 200)
    assert.equal(await verifyAdminSession(cookie.split('=')[1]), null)
    assert.equal((await login(request('login', { username, password: nextPassword }))).status, 200)
    assert.equal((await login(request('login', { username, password }))).status, 401)
  }))

test('legacy JSON accounts can also sign in without a code when MFA is explicitly disabled', () =>
  configured(async () => {
    delete process.env.ADMIN_USER
    delete process.env.ADMIN_PASSWORD
    process.env.ADMIN_ACCOUNTS_JSON = JSON.stringify([
      {
        username,
        role: 'admin',
        passwordHash: await hashAdminPassword(password),
        requireMfaSetup: true,
      },
    ])
    assert.equal(diagnoseAdminEnvironment(process.env).ready, true)
    await signIn()
  }))
