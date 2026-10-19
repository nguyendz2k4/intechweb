import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import {
  ApiError,
  apiErrorResponse,
  assertAllowedKeys,
  dateField,
  enforceRateLimit,
  escapeHtml,
  httpUrlField,
  rateLimitIdentity,
  readJsonObject,
  stringArrayField,
  textField,
} from '../app/lib/api-security'
import { validateUpload } from '../app/lib/upload-security'

function json(body: string, headers: Record<string, string> = {}) {
  return new Request('https://example.test/api', {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body,
  })
}

test('JSON parsing rejects invalid types, unsupported content type and oversized streams', async () => {
  for (const value of ['null', '[]', 'true', '"text"', '{'])
    await assert.rejects(readJsonObject(json(value)), ApiError)
  await assert.rejects(
    readJsonObject(json('{}', { 'content-type': 'text/plain' })),
    (error: unknown) => error instanceof ApiError && error.status === 415,
  )
  await assert.rejects(
    readJsonObject(json('{"value":"' + 'a'.repeat(30) + '"}'), 16),
    (error: unknown) => error instanceof ApiError && error.status === 413,
  )
  assert.deepEqual(await readJsonObject(json('{"title":"Hợp lệ"}')), { title: 'Hợp lệ' })
})

test('server validation rejects unexpected fields, type coercion, URL schemes and impossible dates', () => {
  assert.throws(() => assertAllowedKeys({ title: 'safe', role: 'admin' }, ['title']), ApiError)
  for (const value of [null, 5, [], {}])
    assert.throws(() => textField({ name: value }, 'name', { required: true, max: 120 }), ApiError)
  assert.throws(
    () => stringArrayField({ specs: ['valid', 2] }, 'specs', { maxItems: 10, maxLength: 200 }),
    ApiError,
  )
  for (const url of [
    'javascript:alert(1)',
    'data:image/svg+xml,test',
    'https://user:password@example.test',
    '//evil.test/file',
    '/uploads/../secret',
  ])
    assert.throws(() => httpUrlField({ url }, 'url', { allowLocal: true }), ApiError)
  assert.equal(
    httpUrlField({ url: '/uploads/images/image.png' }, 'url', { allowLocal: true }),
    '/uploads/images/image.png',
  )
  for (const date of ['2026-02-30', '2026-13-01', '0001-01-01', '2026-1-2'])
    assert.throws(() => dateField({ date }, 'date'), ApiError)
  assert.equal(dateField({ date: '2028-02-29' }, 'date'), '2028-02-29')
})

test('email HTML is escaped and unknown exceptions never reveal internal details', async () => {
  assert.equal(
    escapeHtml('<img src="x" onerror=\'a\'>&'),
    '&lt;img src=&quot;x&quot; onerror=&#39;a&#39;&gt;&amp;',
  )
  const response = apiErrorResponse(new Error('postgresql://private-password@db.test'))
  assert.equal(response.status, 503)
  assert.ok(!(await response.text()).includes('private-password'))
})

test('rate limiting ignores spoofed forwarded IPs and limits across request objects', async () => {
  const oldBackend = process.env.RATE_LIMIT_BACKEND,
    oldHeader = process.env.RATE_LIMIT_TRUSTED_IP_HEADER
  process.env.RATE_LIMIT_BACKEND = 'memory'
  delete process.env.RATE_LIMIT_TRUSTED_IP_HEADER
  try {
    assert.equal(
      rateLimitIdentity(
        new Request('https://example.test', { headers: { 'x-forwarded-for': '1.2.3.4' } }),
      ),
      'shared',
    )
    const scope = `test:rate:${Date.now()}`
    assert.equal(
      await enforceRateLimit(new Request('https://example.test'), scope, 2, 60_000),
      null,
    )
    assert.equal(
      await enforceRateLimit(
        new Request('https://example.test', { headers: { 'x-forwarded-for': '5.6.7.8' } }),
        scope,
        2,
        60_000,
      ),
      null,
    )
    const denied = await enforceRateLimit(
      new Request('https://example.test', { headers: { 'x-forwarded-for': '9.10.11.12' } }),
      scope,
      2,
      60_000,
    )
    assert.equal(denied?.status, 429)
    assert.ok(Number(denied?.headers.get('retry-after')) > 0)
    process.env.RATE_LIMIT_TRUSTED_IP_HEADER = 'x-verified-client-ip'
    assert.equal(
      rateLimitIdentity(
        new Request('https://example.test', { headers: { 'x-verified-client-ip': '127.0.0.1' } }),
      ),
      '127.0.0.1',
    )
    assert.equal(
      rateLimitIdentity(
        new Request('https://example.test', {
          headers: { 'x-verified-client-ip': '1.2.3.4, 5.6.7.8' },
        }),
      ),
      'shared',
    )
  } finally {
    if (oldBackend === undefined) delete process.env.RATE_LIMIT_BACKEND
    else process.env.RATE_LIMIT_BACKEND = oldBackend
    if (oldHeader === undefined) delete process.env.RATE_LIMIT_TRUSTED_IP_HEADER
    else process.env.RATE_LIMIT_TRUSTED_IP_HEADER = oldHeader
  }
})

test('uploads verify bytes rather than trusting MIME or the client extension', async () => {
  const image = await readFile(new URL('../public/favicon-48.png', import.meta.url))
  assert.equal(validateUpload(image, 'image/png', 'image'), '.png')
  assert.throws(() => validateUpload(image, 'image/jpeg', 'image'), ApiError)
  for (const mime of ['image/svg+xml', 'image/png', 'image/jpeg', 'application/pdf'])
    assert.throws(
      () =>
        validateUpload(
          Buffer.from('<svg onload="alert(1)"></svg>'),
          mime,
          mime === 'application/pdf' ? 'datasheet' : 'image',
        ),
      ApiError,
    )
  assert.throws(() => validateUpload(image, 'image/png', 'datasheet'), ApiError)
  assert.throws(
    () => validateUpload(new Uint8Array(3 * 1024 * 1024 + 1), 'image/png', 'image'),
    (error: unknown) => error instanceof ApiError && error.status === 413,
  )
})
