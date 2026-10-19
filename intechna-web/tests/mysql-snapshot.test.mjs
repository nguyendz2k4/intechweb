import assert from 'node:assert/strict'
import { test } from 'node:test'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  SCHEMA_VERSION,
  SNAPSHOT_FORMAT,
  SnapshotError,
  TABLE_NAMES,
  assertRestoreTarget,
  databaseIdentity,
  privateDirectory,
  safeArchiveEntry,
  sha256,
  validateSnapshot,
  verifyArchive,
  writeManifest,
} from '../scripts/mysql-snapshot.mjs'

test('durable MFA snapshots reject raw secrets and duplicate usernames', () => {
  const snapshot = fixture()
  const credential = {
    username: 'owner',
    password_hash: null,
    totp_encrypted: 'RAW_MFA_SECRET',
    revision: 'a'.repeat(32),
    updated_at: '2026-10-13T06:00:00.000Z',
  }
  snapshot.tables.security_admin_credentials = [credential]
  assert.throws(() => validateSnapshot(snapshot), /encrypted/)
  credential.totp_encrypted = null
  snapshot.tables.security_admin_credentials = [credential, credential]
  assert.throws(() => validateSnapshot(snapshot), /duplicate/)
})

function fixture() {
  return {
    format: SNAPSHOT_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    createdAt: '2026-10-13T06:00:00.000Z',
    tables: Object.fromEntries(TABLE_NAMES.map((table) => [table, []])),
  }
}

async function archive(t) {
  const base = path.resolve('backups')
  await mkdir(base, { recursive: true })
  const directory = await mkdtemp(path.join(base, 'snapshot-test-'))
  t.after(async () => {
    // Delete only the test directory that mkdtemp created within this workspace.
    assert.equal(path.dirname(path.resolve(directory)), base)
    assert.ok(path.basename(directory).startsWith('snapshot-test-'))
    await rm(directory, { recursive: true, force: true })
  })
  const snapshot = fixture()
  await writeFile(path.join(directory, 'database.json'), JSON.stringify(snapshot))
  await writeManifest(
    directory,
    snapshot,
    sha256(databaseIdentity('mysql://fixture:fixture@source.example.test/test')),
    false,
  )
  return { directory, snapshot }
}

test('restore target guard rejects production, missing target, runtime and database host aliases', () => {
  const source = 'mysql://source:secret@ep-test-pooler.db.test/source%5Fdb'
  const sourceHash = sha256(databaseIdentity(source))
  const safe = {
    RESTORE_TARGET_ENV: 'staging',
    RESTORE_DATABASE_URL: 'mysql://restore:secret@ep-test.db.test/qa',
    DATABASE_URL: source,
  }
  assert.equal(assertRestoreTarget(safe, sourceHash), safe.RESTORE_DATABASE_URL)
  assert.throws(
    () => assertRestoreTarget({ ...safe, RESTORE_TARGET_ENV: 'production' }, sourceHash),
    SnapshotError,
  )
  assert.throws(
    () => assertRestoreTarget({ ...safe, RESTORE_DATABASE_URL: undefined }, sourceHash),
    SnapshotError,
  )
  assert.throws(
    () =>
      assertRestoreTarget(
        {
          ...safe,
          RESTORE_DATABASE_URL: 'mysql://other:secret@EP-TEST.db.test:3306/source_db',
        },
        sourceHash,
      ),
    SnapshotError,
  )
  assert.throws(
    () =>
      assertRestoreTarget(
        {
          ...safe,
          RESTORE_DATABASE_URL: 'mysql://other:secret@source.example.test/runtime',
          DATABASE_URL: 'mysql://runtime:secret@source.example.test/runtime',
        },
        sourceHash,
      ),
    SnapshotError,
  )
})

test('snapshots preserve raw IDs, nullable values, dates, arrays and text without coercion', () => {
  const snapshot = fixture()
  snapshot.tables.products.push({
    id: 91,
    slug: 'fixture',
    name: 'Fixture',
    brand: 'Brand',
    category: 'Switch',
    category_slug: 'switch',
    badges: ['A', null],
    summary: null,
    price_vnd: null,
    specs: ["quoted ' value"],
    applications: [],
    image_url: '',
    datasheet_url: null,
    status: 'draft',
    created_at: '2026-10-13T00:00:00+00:00',
  })
  assert.equal(validateSnapshot(snapshot).products, 1)
  snapshot.tables.products.push({ ...snapshot.tables.products[0] })
  assert.throws(() => validateSnapshot(snapshot), SnapshotError)
  snapshot.tables.products.pop()
  snapshot.tables.products[0].id = '91'
  assert.throws(() => validateSnapshot(snapshot), SnapshotError)
})

test('unsafe public backup paths and portable archive filenames are rejected', async () => {
  await assert.rejects(privateDirectory('public/uploads/backup'), SnapshotError)
  await assert.rejects(privateDirectory('.next/static/confidential'), SnapshotError)
  for (const entry of [
    '../database.json',
    '/database.json',
    'uploads/../.env',
    'uploads/.. /.env',
    'uploads\\x',
    'uploads/file:stream',
    'uploads/CON',
    'uploads/file.',
    'uploads/x/./a',
    'credentials.env',
  ])
    assert.equal(safeArchiveEntry(entry), false)
  assert.equal(safeArchiveEntry('uploads/images/fixture.png'), true)
})

test('archive verification detects corruption before any database write', async (t) => {
  const { directory } = await archive(t)
  assert.deepEqual(
    (await verifyArchive(directory)).manifest.rowCounts,
    Object.fromEntries(TABLE_NAMES.map((table) => [table, 0])),
  )
  await writeFile(path.join(directory, 'database.json'), '{"corrupt":true}')
  await assert.rejects(verifyArchive(directory), /checksum mismatch/)
})

test('archive verification rejects unlisted files and falsified row counts', async (t) => {
  const { directory } = await archive(t)
  await writeFile(path.join(directory, 'unexpected.json'), '{}')
  await assert.rejects(verifyArchive(directory), /unlisted files/)
  await rm(path.join(directory, 'unexpected.json'))
  const manifestPath = path.join(directory, 'manifest.json')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  manifest.rowCounts.products = 1
  await writeFile(manifestPath, JSON.stringify(manifest))
  await assert.rejects(verifyArchive(directory), /row counts/)
})

test('archive verification rejects symlink/junction directories before following them', async (t) => {
  const { directory } = await archive(t)
  const actual = path.join(directory, 'actual-upload-directory')
  await mkdir(actual)
  try {
    await symlink(
      actual,
      path.join(directory, 'uploads'),
      process.platform === 'win32' ? 'junction' : 'dir',
    )
  } catch (error) {
    if (['EPERM', 'EACCES'].includes(error.code)) {
      t.skip('This execution policy cannot create directory links.')
      return
    }
    throw error
  }
  await assert.rejects(verifyArchive(directory), /symbolic links or junctions/)
})
