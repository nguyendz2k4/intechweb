import assert from 'node:assert/strict'
import { scryptSync } from 'node:crypto'
import { test } from 'node:test'
import { NextRequest } from 'next/server'
import { proxy } from '../proxy'
import {
  adminCookieName,
  adminSessionCookie,
  authenticateAdmin,
  clearAdminSessionCookie,
  createAdminSession,
  getAdminSession,
  matchTotpCounter,
  requireAdmin,
  validateAdminRequest,
  verifyAdminSession,
} from '../app/lib/admin-auth'
import { consumeAdminTotp } from '../app/lib/admin-auth-replay'
import { POST as login } from '../app/api/admin/auth/login/route'
import { POST as logout } from '../app/api/admin/auth/logout/route'
import { GET as sessionInfo } from '../app/api/admin/auth/session/route'
const secret = 'test-only-session-key-at-least-thirty-two-characters'
const fakeHash = `scrypt$131072$8$1$${Buffer.alloc(16).toString('base64url')}$${Buffer.alloc(64).toString('base64url')}`
const totpSecret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ'
const envKeys = [
  'NODE_ENV',
  'ADMIN_ENABLED',
  'ADMIN_SESSION_SECRET',
  'ADMIN_ACCOUNTS_JSON',
  'ADMIN_TRUSTED_ORIGINS',
  'ADMIN_SESSION_TTL_SECONDS',
  'ADMIN_USER',
  'ADMIN_PASSWORD',
  'DATABASE_URL',
  'RATE_LIMIT_BACKEND',
  'ADMIN_CREDENTIAL_ENCRYPTION_KEY',
]
async function configured(
  run: () => void | Promise<void>,
  overrides: Record<string, string | undefined> = {},
) {
  const saved = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]))
  for (const key of envKeys) delete process.env[key]
  Object.assign(process.env, {
    NODE_ENV: 'test',
    ADMIN_SESSION_SECRET: secret,
    ADMIN_ACCOUNTS_JSON: JSON.stringify([
      { username: 'editor', passwordHash: fakeHash, role: 'editor' },
    ]),
  })
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  try {
    await run()
  } finally {
    for (const [key, value] of Object.entries(saved)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
  }
}
function request(
  method = 'GET',
  token?: string,
  origin = 'http://localhost:3000',
  path = '/api/admin/products',
) {
  const headers: Record<string, string> = { host: 'localhost:3000' }
  if (token) headers.cookie = `${adminCookieName()}=${token}`
  if (origin) headers.origin = origin
  return new Request(`http://localhost:3000${path}`, { method, headers })
}
test('admin APIs reject basic auth and do their own server role checks', async () =>
  configured(async () => {
    assert.equal(
      (
        await requireAdmin(
          new Request('http://localhost:3000/api/admin/products', {
            headers: { authorization: 'Basic ZWRpdG9yOnBhc3N3b3Jk' },
          }),
        )
      )?.status,
      401,
    )
    const { token } = await createAdminSession('editor')
    assert.equal(await requireAdmin(request('GET', token), 'products:read'), null)
    assert.equal(await requireAdmin(request('POST', token), 'products:write'), null)
    assert.equal((await requireAdmin(request('GET', token), 'contacts:read'))?.status, 403)
    assert.equal((await requireAdmin(request('POST', token), 'warranty:write'))?.status, 403)
  }))
test('session signature, absolute expiry, duplicate cookies, and credential changes are enforced', async () =>
  configured(async () => {
    const now = Math.floor(Date.now() / 1000)
    const { token, session } = await createAdminSession('editor', now)
    assert.equal((await verifyAdminSession(token, now))?.role, 'editor')
    assert.equal(await verifyAdminSession(token, session.expiresAt), null)
    const [payload, signature] = token.split('.')
    assert.equal(
      await verifyAdminSession(
        `${payload}.${signature[0] === 'A' ? 'B' : 'A'}${signature.slice(1)}`,
        now,
      ),
      null,
    )
    const altered = JSON.parse(Buffer.from(payload, 'base64url').toString())
    altered.role = 'admin'
    assert.equal(
      await verifyAdminSession(
        `${Buffer.from(JSON.stringify(altered)).toString('base64url')}.${signature}`,
        now,
      ),
      null,
    )
    assert.equal(
      await getAdminSession(
        new Request('http://localhost:3000', {
          headers: { cookie: `${adminCookieName()}=${token}; ${adminCookieName()}=${token}` },
        }),
      ),
      null,
    )
    process.env.ADMIN_ACCOUNTS_JSON = JSON.stringify([
      { username: 'editor', passwordHash: fakeHash, role: 'admin' },
    ])
    assert.equal(await verifyAdminSession(token, now), null)
    process.env.ADMIN_ACCOUNTS_JSON = JSON.stringify([
      { username: 'editor', passwordHash: fakeHash.replace(/A$/, 'B'), role: 'editor' },
    ])
    assert.equal(await verifyAdminSession(token, now), null)
  }))
test('mutation origin check rejects cross-origin and missing origin requests', async () =>
  configured(async () => {
    const { token } = await createAdminSession('editor')
    assert.equal((await requireAdmin(request('POST', token, 'https://attacker.test')))?.status, 403)
    assert.equal((await requireAdmin(request('DELETE', token, '')))?.status, 403)
    assert.equal(validateAdminRequest(request('POST', undefined)), null)
  }))
test('the admin kill switch rejects active sessions immediately', async () =>
  configured(async () => {
    const { token } = await createAdminSession('editor')
    process.env.ADMIN_ENABLED = 'false'
    assert.equal((await requireAdmin(request('GET', token)))?.status, 503)
    assert.equal(await verifyAdminSession(token), null)
  }))
test('login, session info, and logout expose permissions without credentials', async () =>
  configured(
    async () => {
      const request = new Request('http://localhost:3000/api/admin/auth/login', {
        method: 'POST',
        headers: {
          host: 'localhost:3000',
          origin: 'http://localhost:3000',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          username: 'development-admin',
          password: 'development-password-1234',
        }),
      })
      const response = await login(request)
      assert.equal(response.status, 200)
      const payload = await response.json()
      assert.equal(payload.role, 'admin')
      assert.ok(payload.permissions.includes('contacts:read'))
      assert.deepEqual(Object.keys(payload).sort(), [
        'expiresAt',
        'permissions',
        'role',
        'username',
      ])
      const cookie = response.headers.get('set-cookie')!.split(';')[0]
      const sessionRequest = new Request('http://localhost:3000/api/admin/auth/session', {
        headers: { cookie },
      })
      assert.equal((await sessionInfo(sessionRequest)).status, 200)
      const loggedOut = await logout(
        new Request('http://localhost:3000/api/admin/auth/logout', {
          method: 'POST',
          headers: { cookie, origin: 'http://localhost:3000' },
        }),
      )
      assert.equal(loggedOut.status, 200)
      assert.match(loggedOut.headers.get('set-cookie')!, /Max-Age=0/)
      assert.equal((await sessionInfo(sessionRequest)).status, 401)
      assert.equal(
        (await sessionInfo(new Request('http://localhost:3000/api/admin/auth/session'))).status,
        401,
      )
    },
    {
      ADMIN_ACCOUNTS_JSON: undefined,
      ADMIN_USER: 'development-admin',
      ADMIN_PASSWORD: 'development-password-1234',
      RATE_LIMIT_BACKEND: 'memory',
    },
  ))
test('production requires MFA, trusted HTTPS origins, and emits hardened host-only cookies', async () =>
  configured(
    async () => {
      assert.equal(validateAdminRequest(request())?.status, 503)
      process.env.ADMIN_TRUSTED_ORIGINS = 'https://admin.intechna.vn'
      process.env.ADMIN_ACCOUNTS_JSON = JSON.stringify([
        { username: 'editor', passwordHash: fakeHash, role: 'editor', totpSecret },
      ])
      process.env.ADMIN_CREDENTIAL_ENCRYPTION_KEY =
        'test-encryption-key-at-least-thirty-two-characters'
      await assert.rejects(createAdminSession('editor'), /storage unavailable/)
      const token = 'test-cookie-token',
        session = { expiresAt: Math.floor(Date.now() / 1000) + 3600 }
      const cookie = adminSessionCookie(token, session.expiresAt)
      assert.ok(cookie.startsWith('__Host-intech_admin_session='))
      assert.match(cookie, /HttpOnly/)
      assert.match(cookie, /Secure/)
      assert.match(cookie, /SameSite=Strict/)
      assert.doesNotMatch(cookie, /Domain=/)
      assert.match(clearAdminSessionCookie(), /Max-Age=0/)
      const safe = new Request('https://admin.intechna.vn/api/admin/products', {
        headers: { host: 'admin.intechna.vn', cookie },
      })
      assert.equal(validateAdminRequest(safe), null)
      assert.equal((await requireAdmin(safe, 'products:read'))?.status, 401)
      assert.equal((await requireAdmin(request('GET', token)))?.status, 403)
      process.env.ADMIN_TRUSTED_ORIGINS = 'http://admin.intechna.vn'
      assert.equal(validateAdminRequest(safe)?.status, 503)
    },
    { NODE_ENV: 'production' },
  ))
test('TOTP matches published RFC 6238 SHA-1 vectors and limits drift', () => {
  assert.equal(matchTotpCounter(totpSecret, '287082', 59), 1)
  assert.equal(matchTotpCounter(totpSecret, '081804', 1111111109), Math.floor(1111111109 / 30))
  assert.equal(matchTotpCounter(totpSecret, '287082', 120), null)
  assert.equal(matchTotpCounter(totpSecret, '000000', 59), null)
  assert.equal(matchTotpCounter('INVALID', '287082', 59), null)
})
test('MFA replay consumption is atomic in development and requires persistence in production', async () =>
  configured(async () => {
    const results = await Promise.all([
      consumeAdminTotp('test-identity', 42),
      consumeAdminTotp('test-identity', 42),
    ])
    assert.deepEqual(results.sort(), [false, true])
    Object.assign(process.env, { NODE_ENV: 'production' })
    await assert.rejects(consumeAdminTotp('prod-identity', 43), /unavailable/)
  }))
test('scrypt credentials verify exact passwords and reject unknown accounts', async () =>
  configured(async () => {
    const password = 'test password 12+'
    const salt = Buffer.alloc(16, 7)
    const key = scryptSync(password, salt, 64, { N: 131072, r: 8, p: 1, maxmem: 160 * 1024 * 1024 })
    process.env.ADMIN_ACCOUNTS_JSON = JSON.stringify([
      {
        username: 'editor',
        passwordHash: `scrypt$131072$8$1$${salt.toString('base64url')}$${key.toString('base64url')}`,
        role: 'editor',
      },
    ])
    assert.equal((await authenticateAdmin('editor', password, ''))?.username, 'editor')
    assert.equal(await authenticateAdmin('editor', `${password} `, ''), null)
    assert.equal(await authenticateAdmin('unknown', password, ''), null)
  }))
test('proxy gates extension-looking admin paths and never rewrites admin API or assets', async () =>
  configured(async () => {
    for (const path of ['/admin/san-pham.js', '/api/admin/products.js']) {
      const response = await proxy(new NextRequest(`http://localhost:3000${path}`))
      assert.ok(response.status === 401 || response.status === 307)
      assert.equal(response.headers.get('x-middleware-next'), null)
    }
    const { token } = await createAdminSession('editor')
    const headers = { host: 'admin.localhost:3000', cookie: `${adminCookieName()}=${token}` }
    for (const path of ['/api/admin/products', '/_next/static/runtime.js', '/images/logo.svg']) {
      const response = await proxy(
        new NextRequest(`http://admin.localhost:3000${path}`, { headers }),
      )
      assert.equal(response.headers.get('x-middleware-rewrite'), null)
      assert.equal(response.headers.get('x-middleware-next'), '1')
    }
    const rewritten = await proxy(
      new NextRequest('http://admin.localhost:3000/san-pham', { headers }),
    )
    assert.equal(
      rewritten.headers.get('x-middleware-rewrite'),
      'http://admin.localhost:3000/admin/san-pham',
    )
  }))
