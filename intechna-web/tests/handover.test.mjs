import assert from 'node:assert/strict'
import { test } from 'node:test'
import { inflateRawSync } from 'node:zlib'
import { safeSourcePath, assertNoCredentials } from '../scripts/handover-files.mjs'
import { sourceZip } from '../scripts/source-zip.mjs'

test('handover allowlist refuses account links, secrets, private data, runtime uploads and generated builds', () => {
  for (const name of [
    '.env',
    '.env.local',
    '.vercel/project.json',
    '.secrets/key',
    'data/owner/account.txt',
    'backups/database.json',
    '.next/server.js',
    'node_modules/next/package.json',
    'public/uploads/images/customer.png',
    'scripts/.env',
    'scripts/private.json',
    '../app/page.tsx',
    'app/../.env',
  ])
    assert.equal(safeSourcePath(name), false, name)
  for (const name of [
    '.env.example',
    'app/page.tsx',
    'scripts/db-migrate.mjs',
    'docs/handover/README.md',
    'public/images/hardware/switch.webp',
  ])
    assert.equal(safeSourcePath(name), true, name)
})

test('source packaging blocks real database credentials but permits non-routable test fixtures', () => {
  const credentialUrl = ['mysql://owner:secret@', 'customer.database.example/database'].join('')
  assert.throws(() => assertNoCredentials('script.ts', Buffer.from(credentialUrl)))
  assert.doesNotThrow(() =>
    assertNoCredentials('test.ts', Buffer.from('mysql://fixture:fixture@db.example.test/database')),
  )
})

test('portable source ZIP preserves UTF-8 content, has standard central directory and refuses traversal', () => {
  const content = Buffer.from('Mã nguồn bàn giao')
  const archive = sourceZip([{ name: 'intechna/README.md', bytes: content }])
  assert.equal(archive.readUInt32LE(), 0x04034b50)
  const start = 30 + archive.readUInt16LE(26)
  const end = start + archive.readUInt32LE(18)
  assert.deepEqual(inflateRawSync(archive.subarray(start, end)), content)
  assert.equal(archive.readUInt32LE(end), 0x02014b50)
  assert.equal(archive.readUInt32LE(archive.length - 22), 0x06054b50)
  assert.throws(() => sourceZip([{ name: '../.env', bytes: content }]))
})
