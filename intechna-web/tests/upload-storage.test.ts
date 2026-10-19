import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { ApiError } from '../app/lib/api-security'
import {
  configuredUploadStorage,
  storeUpload,
  uploadMultipartLimit,
} from '../app/lib/upload-storage'
import {
  MAX_BLOB_FILE_BYTES,
  MAX_BLOB_MULTIPART_BYTES,
  MAX_MULTIPART_BYTES,
} from '../app/lib/upload-security'

const blobStorage = { provider: 'vercel-blob' as const, token: 'fixture-token' }
const publicBlobOrigin = 'https://fixture.public.blob.vercel-storage.com'

test('production uploads require explicit persistent local storage or a configured Blob token', () => {
  assert.deepEqual(configuredUploadStorage({ NODE_ENV: 'development' }), { provider: 'local' })
  assert.deepEqual(
    configuredUploadStorage({
      NODE_ENV: 'production',
      UPLOAD_STORAGE: 'local',
      UPLOAD_LOCAL_PERSISTENT: 'true',
    }),
    { provider: 'local' },
  )
  assert.deepEqual(
    configuredUploadStorage({
      NODE_ENV: 'production',
      UPLOAD_STORAGE: 'vercel-blob',
      BLOB_READ_WRITE_TOKEN: 'fixture-token',
    }),
    blobStorage,
  )
  for (const env of [
    { NODE_ENV: 'production' },
    { NODE_ENV: 'production', UPLOAD_STORAGE: 'local' },
    { NODE_ENV: 'production', UPLOAD_STORAGE: 'vercel-blob' },
    {
      NODE_ENV: 'production',
      UPLOAD_STORAGE: 'local',
      UPLOAD_LOCAL_PERSISTENT: 'true',
      VERCEL: '1',
    },
    { NODE_ENV: 'development', UPLOAD_STORAGE: 'unknown' },
  ] as const)
    assert.throws(
      () => configuredUploadStorage(env),
      (error: unknown) => error instanceof ApiError && error.status === 503,
    )
  assert.equal(uploadMultipartLimit(blobStorage), MAX_BLOB_MULTIPART_BYTES)
  assert.equal(uploadMultipartLimit({ provider: 'local' }), MAX_MULTIPART_BYTES)
  assert.ok(MAX_BLOB_MULTIPART_BYTES < 4.5 * 1000 * 1000)
})

test('Blob image uploads use validated MIME, UUID paths and explicit public options', async () => {
  const bytes = await readFile(new URL('../public/favicon-48.png', import.meta.url))
  const uploaded = await storeUpload(bytes, 'image/PNG', 'image', blobStorage, {
    putBlob: async (pathname, payload, options) => {
      assert.match(pathname, /^uploads\/images\/[0-9a-f-]{36}\.png$/)
      assert.deepEqual(payload, bytes)
      assert.deepEqual(options, {
        access: 'public',
        token: 'fixture-token',
        contentType: 'image/png',
        addRandomSuffix: false,
        allowOverwrite: false,
      })
      return {
        url: `${publicBlobOrigin}/${pathname}`,
        downloadUrl: `${publicBlobOrigin}/${pathname}?download=1`,
      }
    },
    writeLocal: async () => assert.fail('Blob upload must not write the local filesystem.'),
  })
  assert.equal(uploaded.url, `${publicBlobOrigin}/uploads/images/${uploaded.filename}`)
})

test('Blob PDF uploads return the attachment URL while local storage keeps its public route', async () => {
  const bytes = new TextEncoder().encode('%PDF-1.7\nfixture\n%%EOF')
  const pdf = await storeUpload(bytes, 'application/pdf', 'datasheet', blobStorage, {
    putBlob: async (pathname, _payload, options) => {
      assert.match(pathname, /^uploads\/datasheets\/[0-9a-f-]{36}\.pdf$/)
      assert.equal(options.contentType, 'application/pdf')
      return {
        url: `${publicBlobOrigin}/${pathname}`,
        downloadUrl: `${publicBlobOrigin}/${pathname}?download=1`,
      }
    },
  })
  assert.equal(pdf.url, `${publicBlobOrigin}/uploads/datasheets/${pdf.filename}?download=1`)
  let writtenPath = ''
  const local = await storeUpload(
    bytes,
    'application/pdf',
    'datasheet',
    { provider: 'local' },
    {
      writeLocal: async (pathname, payload) => {
        writtenPath = pathname
        assert.deepEqual(payload, bytes)
      },
      putBlob: async () => assert.fail('Local upload must not call Blob.'),
    },
  )
  assert.equal(local.url, `/${writtenPath}`)
  assert.match(local.url, /^\/uploads\/datasheets\/[0-9a-f-]{36}\.pdf$/)
})

test('invalid bytes and oversized server uploads never reach either storage adapter', async () => {
  const dependencies = {
    putBlob: async () => assert.fail('Invalid upload reached Blob.'),
    writeLocal: async () => assert.fail('Invalid upload reached the filesystem.'),
  }
  await assert.rejects(
    storeUpload(
      new TextEncoder().encode('<svg onload="alert(1)"></svg>'),
      'image/png',
      'image',
      blobStorage,
      dependencies,
    ),
    ApiError,
  )
  await assert.rejects(
    storeUpload(
      new Uint8Array(MAX_BLOB_FILE_BYTES + 1),
      'application/pdf',
      'datasheet',
      blobStorage,
      dependencies,
    ),
    (error: unknown) => error instanceof ApiError && error.status === 413,
  )
})
