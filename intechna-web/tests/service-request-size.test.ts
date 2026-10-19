import assert from 'node:assert/strict'
import { test } from 'node:test'
import { POST as saveService } from '../app/api/admin/services/route'
import { adminCookieName, createAdminSession } from '../app/lib/admin-auth'
import { serviceInput } from '../app/lib/cms-input'

const environmentKeys = [
  'NODE_ENV',
  'DATABASE_URL',
  'RATE_LIMIT_BACKEND',
  'ADMIN_SESSION_SECRET',
  'ADMIN_ACCOUNTS_JSON',
  'ADMIN_TRUSTED_ORIGINS',
  'ADMIN_SESSION_TTL_SECONDS',
] as const

async function withTestAccount(run: (cookie: string) => Promise<void>) {
  const previous = Object.fromEntries(environmentKeys.map((key) => [key, process.env[key]]))
  Object.assign(process.env, {
    NODE_ENV: 'development',
    DATABASE_URL: '',
    RATE_LIMIT_BACKEND: 'memory',
    ADMIN_SESSION_SECRET: 'service-request-size-regression-'.repeat(2),
    ADMIN_TRUSTED_ORIGINS: 'https://example.test',
    ADMIN_SESSION_TTL_SECONDS: '900',
    ADMIN_ACCOUNTS_JSON: JSON.stringify([
      {
        username: 'size-admin',
        role: 'admin',
        passwordHash: `scrypt$131072$8$1$${'a'.repeat(22)}$${'b'.repeat(86)}`,
      },
    ]),
  })
  try {
    const { token } = await createAdminSession('size-admin')
    await run(`${adminCookieName()}=${token}`)
  } finally {
    for (const key of environmentKeys) {
      if (previous[key] === undefined) delete process.env[key]
      else Object.assign(process.env, { [key]: previous[key] })
    }
  }
}

function serviceRequest(body: string, cookie: string) {
  return new Request('https://example.test/api/admin/services', {
    method: 'POST',
    body,
    headers: { 'content-type': 'application/json', origin: 'https://example.test', cookie },
  })
}

test('valid Vietnamese service lists larger than 16KiB reach persistence instead of failing 413', () =>
  withTestAccount(async (cookie) => {
    const input = {
      slug: 'service-size-regression',
      title: 'ắ'.repeat(180),
      description: 'ậ'.repeat(2000),
      keywords: 'ọ'.repeat(500),
      status: 'published',
      deliverables: Array.from({ length: 30 }, () => 'ệ'.repeat(499)),
      benefits: Array.from({ length: 30 }, () => 'ứ'.repeat(499)),
    }
    assert.deepEqual(serviceInput(input), input)
    const body = JSON.stringify(input)
    assert.ok(Buffer.byteLength(body) > 16 * 1024)
    assert.ok(Buffer.byteLength(body) < 128 * 1024)
    // With no database configured, reaching persistence returns the generic 503.
    // No network call or data write occurs, and the prior 16KiB route cap fails this test.
    const response = await saveService(serviceRequest(body, cookie))
    assert.equal(response.status, 503)
  }))

test('service requests above 128KiB are rejected before database access', () =>
  withTestAccount(async (cookie) => {
    const body = JSON.stringify({ padding: 'a'.repeat(128 * 1024) })
    const response = await saveService(serviceRequest(body, cookie))
    assert.equal(response.status, 413)
  }))
