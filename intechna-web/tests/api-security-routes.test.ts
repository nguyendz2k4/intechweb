import assert from 'node:assert/strict'
import { test } from 'node:test'
import { readFile, unlink } from 'node:fs/promises'
import { adminCookieName, createAdminSession } from '../app/lib/admin-auth'
import { enforceRateLimit } from '../app/lib/api-security'
import {
  GET as getServices,
  POST as saveService,
  DELETE as deleteService,
} from '../app/api/admin/services/route'
import {
  GET as getWarranty,
  POST as createWarranty,
  PUT as updateWarranty,
  DELETE as deleteWarranty,
} from '../app/api/admin/warranty/route'
import { POST as importWarranty } from '../app/api/admin/warranty/import/route'
import { POST as upload } from '../app/api/admin/uploads/route'
import { POST as contact } from '../app/api/contact/route'
import { GET as publicWarranty } from '../app/api/warranty/route'
import { GET as uploadedAsset } from '../app/uploads/[...path]/route'
const envKeys = [
  'NODE_ENV',
  'ADMIN_SESSION_SECRET',
  'ADMIN_ACCOUNTS_JSON',
  'ADMIN_TRUSTED_ORIGINS',
  'DATABASE_URL',
  'RATE_LIMIT_BACKEND',
  'CONTACT_ENABLED',
  'WARRANTY_LOOKUP_ENABLED',
  'UPLOADS_ENABLED',
  'UPLOAD_STORAGE',
  'UPLOAD_LOCAL_PERSISTENT',
  'BLOB_READ_WRITE_TOKEN',
  'VERCEL',
] as const
const hashFixture = `scrypt$131072$8$1$${'a'.repeat(22)}$${'b'.repeat(86)}`
async function configured(run: () => Promise<void>) {
  const previous = Object.fromEntries(envKeys.map((key) => [key, process.env[key]]))
  Object.assign(process.env, {
    NODE_ENV: 'development',
    ADMIN_SESSION_SECRET: 'a'.repeat(32),
    ADMIN_TRUSTED_ORIGINS: 'https://example.test',
    ADMIN_ACCOUNTS_JSON: JSON.stringify(
      ['admin', 'editor', 'support'].map((role) => ({
        username: role,
        role,
        passwordHash: hashFixture,
      })),
    ),
    DATABASE_URL: '',
    RATE_LIMIT_BACKEND: 'memory',
    CONTACT_ENABLED: 'true',
    WARRANTY_LOOKUP_ENABLED: 'true',
    UPLOADS_ENABLED: 'true',
    UPLOAD_STORAGE: 'local',
    UPLOAD_LOCAL_PERSISTENT: 'false',
    BLOB_READ_WRITE_TOKEN: '',
    VERCEL: '',
  })
  try {
    await run()
  } finally {
    for (const key of envKeys)
      if (previous[key] === undefined) delete process.env[key]
      else Object.assign(process.env, { [key]: previous[key] })
  }
}
async function request(method: string, body?: string, role?: string) {
  const headers = new Headers({
    origin: 'https://example.test',
    'content-type': 'application/json',
  })
  if (role) headers.set('cookie', `${adminCookieName()}=${(await createAdminSession(role)).token}`)
  return new Request('https://example.test/api/admin/test', { method, headers, body })
}
test('admin APIs reject missing sessions before body parsing or database access', () =>
  configured(async () => {
    for (const [handler, method] of [
      [getServices, 'GET'],
      [saveService, 'POST'],
      [deleteService, 'DELETE'],
      [getWarranty, 'GET'],
      [createWarranty, 'POST'],
      [importWarranty, 'POST'],
      [updateWarranty, 'PUT'],
      [deleteWarranty, 'DELETE'],
      [upload, 'POST'],
    ] as const) {
      const response = await handler(await request(method, method === 'GET' ? undefined : '{'))
      assert.equal(response.status, 401)
    }
  }))
test('permissions are enforced by route handlers for signed support and editor sessions', () =>
  configured(async () => {
    assert.equal((await saveService(await request('POST', '{}', 'support'))).status, 403)
    assert.equal((await getServices(await request('GET', undefined, 'support'))).status, 403)
    assert.equal((await upload(await request('POST', '{}', 'support'))).status, 403)
    assert.equal((await getWarranty(await request('GET', undefined, 'editor'))).status, 403)
    assert.equal((await createWarranty(await request('POST', '{}', 'editor'))).status, 403)
    assert.equal((await importWarranty(await request('POST', '{}', 'editor'))).status, 403)
    assert.equal((await updateWarranty(await request('PUT', '{}', 'editor'))).status, 403)
    assert.equal((await deleteWarranty(await request('DELETE', '{}', 'editor'))).status, 403)
  }))
test('warranty edits and deletion reject cross-origin requests before reading the body', () =>
  configured(async () => {
    for (const [handler, method] of [
      [updateWarranty, 'PUT'],
      [deleteWarranty, 'DELETE'],
      [importWarranty, 'POST'],
    ] as const) {
      const incoming = await request(method, '{', 'support')
      incoming.headers.set('origin', 'https://untrusted.test')
      assert.equal((await handler(incoming)).status, 403)
    }
  }))
test('authorized mutations reject bad types and dates without needing a database', () =>
  configured(async () => {
    assert.equal(
      (
        await saveService(
          await request('POST', JSON.stringify({ title: {}, description: 'safe' }), 'admin'),
        )
      ).status,
      400,
    )
    assert.equal(
      (
        await saveService(
          await request(
            'POST',
            JSON.stringify({ title: 'safe', description: 'safe', adminLayout: 'custom' }),
            'admin',
          ),
        )
      ).status,
      400,
    )
    assert.equal(
      (
        await createWarranty(
          await request(
            'POST',
            JSON.stringify({
              serial: 'SERIAL1234',
              customer: 'Customer',
              product: 'Switch',
              purchaseDate: '2026-02-30',
            }),
            'support',
          ),
        )
      ).status,
      400,
    )
    assert.equal(
      (
        await createWarranty(
          await request(
            'POST',
            JSON.stringify({
              serial: 'SERIAL1234',
              customer: 'Customer',
              product: 'Switch',
              purchaseDate: '2026-10-13',
              warrantyUntil: '2026-10-12',
            }),
            'support',
          ),
        )
      ).status,
      400,
    )
    assert.equal(
      (
        await updateWarranty(
          await request(
            'PUT',
            JSON.stringify({
              code: 'INTECH-2024-TEST1',
              serial: 'SERIAL1234',
              customer: 'Customer',
              product: 'Switch',
              purchaseDate: '2024-01-01',
              warrantyUntil: '2023-12-31',
            }),
            'support',
          ),
        )
      ).status,
      400,
    )
    assert.equal(
      (await deleteWarranty(await request('DELETE', JSON.stringify({ code: [] }), 'support')))
        .status,
      400,
    )
  }))
test('contact validates browser fields on the server before persisting', () =>
  configured(async () => {
    for (const payload of [
      { name: {}, phone: '0912345678' },
      { name: 'Customer', phone: '--------' },
      { name: 'Customer', phone: '0912345678', email: 'header\ninjection@example.test' },
      { name: 'Customer', phone: '0912345678', note: [] },
    ]) {
      assert.equal((await contact(await request('POST', JSON.stringify(payload)))).status, 400)
    }
  }))
async function multipart(file: File, kind: string) {
  const form = new FormData()
  form.set('file', file)
  form.set('kind', kind)
  return new Request('https://example.test/api/admin/uploads', {
    method: 'POST',
    body: form,
    headers: {
      origin: 'https://example.test',
      cookie: `${adminCookieName()}=${(await createAdminSession('admin')).token}`,
    },
  })
}
test('uploads reject fake image bytes and use generated authoritative extensions', () =>
  configured(async () => {
    assert.equal(
      (
        await upload(
          await multipart(
            new File(['<svg onload="alert(1)"></svg>'], 'unsafe.png', { type: 'image/png' }),
            'image',
          ),
        )
      ).status,
      400,
    )
    assert.equal(
      (
        await upload(
          await multipart(new File(['fake'], 'x.pdf', { type: 'application/pdf' }), 'unknown'),
        )
      ).status,
      400,
    )
    const image = await readFile(new URL('../public/favicon-48.png', import.meta.url))
    const response = await upload(
      await multipart(new File([image], '../../unsafe.svg', { type: 'image/png' }), 'image'),
    )
    assert.equal(response.status, 200)
    const result = (await response.json()) as {
      url: string
    }
    assert.match(
      result.url,
      /^\/uploads\/images\/[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.png$/,
    )
    const path = new URL(`../public${result.url}`, import.meta.url)
    try {
      assert.deepEqual(await readFile(path), image)
      const served = await uploadedAsset(new Request(`https://example.test${result.url}`), {
        params: Promise.resolve({ path: result.url.slice('/uploads/'.length).split('/') }),
      })
      assert.equal(served.status, 200)
      assert.equal(served.headers.get('content-type'), 'image/png')
      assert.equal(served.headers.get('x-content-type-options'), 'nosniff')
      assert.deepEqual(Buffer.from(await served.arrayBuffer()), image)
    } finally {
      await unlink(path)
    }
  }))
test('runtime media reader rejects traversal, nonpublic files, unknown folders and extension mismatches', async () => {
  for (const parts of [
    ['..', '.env'],
    ['images', '..', '.env'],
    ['private', '00000000-0000-4000-8000-000000000000.png'],
    ['images', 'script.svg'],
    ['datasheets', '00000000-0000-4000-8000-000000000000.png'],
  ]) {
    assert.equal(
      (
        await uploadedAsset(new Request('https://example.test/uploads/test'), {
          params: Promise.resolve({ path: parts }),
        })
      ).status,
      404,
    )
  }
})
test('incident feature switches stop public submission, warranty lookups and uploads', () =>
  configured(async () => {
    Object.assign(process.env, {
      CONTACT_ENABLED: 'false',
      WARRANTY_LOOKUP_ENABLED: 'false',
      UPLOADS_ENABLED: 'false',
    })
    assert.equal((await contact(await request('POST', '{'))).status, 503)
    assert.equal((await publicWarranty(await request('GET'))).status, 503)
    assert.equal((await upload(await request('POST', '{}', 'admin'))).status, 503)
  }))
test('production rate limits fail closed when a persistent backend is missing', () =>
  configured(async () => {
    Object.assign(process.env, { NODE_ENV: 'production', RATE_LIMIT_BACKEND: 'memory' })
    assert.equal(
      (await enforceRateLimit(await request('GET'), 'test:production', 5, 60000))?.status,
      503,
    )
    process.env.RATE_LIMIT_BACKEND = 'database'
    assert.equal(
      (await enforceRateLimit(await request('GET'), 'test:production', 5, 60000))?.status,
      503,
    )
  }))
