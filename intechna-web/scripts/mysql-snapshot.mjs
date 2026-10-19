import { mysqlOptions } from '../app/lib/db/mysql-client.mjs'
import { createHash } from 'node:crypto'
import { copyFile, lstat, mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

export const SNAPSHOT_FORMAT = 'intechna-mysql-logical'
export const SCHEMA_VERSION = 3
export const MAX_ARCHIVE_BYTES = 512 * 1024 * 1024
export const MAX_DATABASE_BYTES = 128 * 1024 * 1024
export const TABLE_COLUMNS = Object.freeze({
  products: {
    id: 'id',
    slug: 'string',
    name: 'string',
    brand: 'string',
    category: 'string',
    category_slug: 'string',
    badges: 'array?',
    summary: 'string?',
    price_vnd: 'price?',
    specs: 'array?',
    applications: 'array?',
    image_url: 'string?',
    datasheet_url: 'string?',
    status: 'publication',
    created_at: 'timestamp?',
  },
  posts: {
    id: 'id',
    slug: 'string',
    title: 'string',
    description: 'string?',
    body: 'string?',
    status: 'publication',
    published_at: 'timestamp?',
  },
  services: {
    id: 'id',
    slug: 'string',
    title: 'string',
    description: 'string?',
    keywords: 'string?',
    deliverables: 'array',
    benefits: 'array',
    status: 'publication',
  },
  warranty: {
    id: 'id',
    code: 'string',
    serial: 'string',
    customer: 'string',
    product: 'string',
    model: 'string?',
    purchase_date: 'string?',
    warranty_until: 'string?',
    status: 'string?',
    note: 'string?',
  },
  contact_submissions: {
    id: 'id',
    name: 'string',
    phone: 'string',
    email: 'string?',
    note: 'string?',
    submitted_at: 'timestamp?',
    status: 'contact-status',
  },
  security_admin_credentials: {
    username: 'username',
    password_hash: 'password-hash?',
    totp_encrypted: 'encrypted-totp?',
    revision: 'revision',
    updated_at: 'timestamp',
  },
})
export const TABLE_NAMES = Object.freeze(Object.keys(TABLE_COLUMNS))
const legacyColumns = Object.fromEntries(
  Object.entries(TABLE_COLUMNS).map(([table, columns]) => [
    table,
    Object.fromEntries(
      Object.entries(columns).filter(
        ([name]) =>
          !(table === 'products' && name === 'price_vnd') &&
          !(table === 'warranty' && name === 'model'),
      ),
    ),
  ]),
)
export class SnapshotError extends Error {}
function fail(message) {
  throw new SnapshotError(message)
}
export function sha256(data) {
  return createHash('sha256').update(data).digest('hex')
}
function record(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}
function keysExactly(value, expected) {
  return (
    record(value) &&
    Object.keys(value).length === expected.length &&
    expected.every((key) => Object.hasOwn(value, key))
  )
}
function validTimestamp(value) {
  return (
    typeof value === 'string' &&
    value.length <= 64 &&
    /^\d{4}-\d\d-\d\d[T ]\d\d:\d\d:\d\d/.test(value) &&
    !Number.isNaN(Date.parse(value))
  )
}

/** Restore requires a different database name, even if host aliases differ. */
export function databaseIdentity(connection) {
  const options =
    typeof connection === 'string' ? mysqlOptions({}, connection) : mysqlOptions(connection)
  return options.database
}

export function assertRestoreTarget(env, sourceDatabaseHash) {
  if (typeof sourceDatabaseHash !== 'string' || !/^[a-f0-9]{64}$/.test(sourceDatabaseHash))
    fail('Invalid backup source identity.')
  if (!['development', 'staging'].includes(env.RESTORE_TARGET_ENV))
    fail('Restore is restricted to an isolated development/staging target.')
  if (!env.RESTORE_DATABASE_URL)
    fail(
      'Set RESTORE_DATABASE_URL explicitly; runtime credentials are never used as a restore target.',
    )
  const target = databaseIdentity(env.RESTORE_DATABASE_URL)
  if (sha256(target) === sourceDatabaseHash)
    fail('Restore target must differ from the backup source database.')
  for (const connection of [
    env.DATABASE_URL || (env.DB_NAME && env.DB_USER ? env : null),
    env.BACKUP_DATABASE_URL,
  ].filter(Boolean))
    if (databaseIdentity(connection) === target)
      fail('Restore target must differ from the current runtime/backup database.')
  return env.RESTORE_DATABASE_URL
}

export function validateRows(tables, definitions = TABLE_COLUMNS) {
  if (!keysExactly(tables, Object.keys(definitions)))
    fail('Snapshot must contain exactly the supported durable tables.')
  const counts = {}
  for (const table of Object.keys(definitions)) {
    const rows = tables[table],
      columns = definitions[table]
    if (!Array.isArray(rows) || rows.length > 100_000) fail('Invalid snapshot row list.')
    const ids = new Set()
    for (const row of rows) {
      if (!keysExactly(row, Object.keys(columns)))
        fail('Snapshot row columns do not match the supported schema.')
      for (const [column, type] of Object.entries(columns)) {
        const value = row[column]
        if (value === null && type.endsWith('?')) continue
        const base = type.replace(/\?$/, '')
        if (
          base === 'price' &&
          (!Number.isSafeInteger(value) || value <= 0 || value > 999_999_999_999)
        )
          fail('Invalid snapshot price.')
        if (
          base === 'username' &&
          (typeof value !== 'string' ||
            !/^[a-zA-Z0-9][a-zA-Z0-9_.@-]{2,79}$/.test(value) ||
            ids.has(value))
        )
          fail('Invalid or duplicate credential username.')
        if (
          base === 'password-hash' &&
          (typeof value !== 'string' ||
            !/^scrypt\$131072\$8\$1\$[A-Za-z0-9_-]{22}\$[A-Za-z0-9_-]{86}$/.test(value))
        )
          fail('Invalid credential password hash.')
        if (
          base === 'encrypted-totp' &&
          (typeof value !== 'string' ||
            !/^v1\.[A-Za-z0-9_-]{16}\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43,171}$/.test(value))
        )
          fail('MFA backup must contain encrypted credentials only.')
        if (
          base === 'revision' &&
          (typeof value !== 'string' || !/^(?:initial|[A-Za-z0-9_-]{32})$/.test(value))
        )
          fail('Invalid credential revision.')
        if (
          base === 'id' &&
          (!Number.isInteger(value) || value < 1 || value > 2_147_483_647 || ids.has(value))
        )
          fail('Snapshot IDs must be unique positive MySQL integers.')
        if (
          base === 'string' &&
          (typeof value !== 'string' || value.length > 1_000_000 || value.includes('\u0000'))
        )
          fail('Invalid snapshot text value.')
        if (
          base === 'array' &&
          (!Array.isArray(value) ||
            value.length > 10_000 ||
            value.some(
              (item) =>
                item !== null &&
                (typeof item !== 'string' || item.length > 1_000_000 || item.includes('\u0000')),
            ))
        )
          fail('Invalid snapshot array value.')
        if (base === 'timestamp' && !validTimestamp(value)) fail('Invalid snapshot timestamp.')
        if (base === 'publication' && !['draft', 'published'].includes(value))
          fail('Invalid snapshot publication status.')
        if (base === 'contact-status' && !['mới', 'đang xử lý', 'đã xử lý'].includes(value))
          fail('Invalid snapshot contact status.')
      }
      ids.add(row.id ?? row.username)
    }
    counts[table] = rows.length
  }
  return counts
}

export function validateSnapshot(snapshot) {
  if (
    !keysExactly(snapshot, ['format', 'schemaVersion', 'createdAt', 'tables']) ||
    snapshot.format !== SNAPSHOT_FORMAT ||
    ![2, SCHEMA_VERSION].includes(snapshot.schemaVersion) ||
    !validTimestamp(snapshot.createdAt)
  )
    fail('Invalid or unsupported snapshot metadata.')
  return validateRows(snapshot.tables, snapshot.schemaVersion === 2 ? legacyColumns : TABLE_COLUMNS)
}

export function safeArchiveEntry(relative) {
  return (
    typeof relative === 'string' &&
    relative.length <= 300 &&
    !relative.includes('\\') &&
    !relative.includes(':') &&
    !relative.includes('\u0000') &&
    !path.isAbsolute(relative) &&
    relative
      .split('/')
      .every(
        (part) =>
          part &&
          part !== '..' &&
          part !== '.' &&
          !/[<>"|?*]/.test(part) &&
          !/[. ]$/.test(part) &&
          !/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(part),
      ) &&
    (relative === 'database.json' || relative.startsWith('uploads/'))
  )
}

export async function assertNoSymlinkPath(filePath, allowMissing = false) {
  const absolute = path.resolve(filePath),
    root = path.parse(absolute).root
  let current = root
  for (const component of absolute.slice(root.length).split(path.sep)) {
    if (!component) continue
    current = path.join(current, component)
    let info
    try {
      info = await lstat(current)
    } catch (error) {
      if (allowMissing && error.code === 'ENOENT') return absolute
      throw error
    }
    if (info.isSymbolicLink()) fail('Snapshot paths must not contain symbolic links or junctions.')
  }
  return absolute
}

export async function privateDirectory(directory, workspace = process.cwd()) {
  const absolute = path.resolve(workspace, directory)
  for (const publicRoot of [path.resolve(workspace, 'public'), path.resolve(workspace, '.next')]) {
    const relative = path.relative(publicRoot, absolute)
    if (
      !relative ||
      (!relative.startsWith(`..${path.sep}`) && relative !== '..' && !path.isAbsolute(relative))
    )
      fail('Confidential snapshots must stay outside public assets and generated Next.js files.')
  }
  await assertNoSymlinkPath(absolute, true)
  return absolute
}

export async function listArchiveFiles(root, relative = '') {
  await assertNoSymlinkPath(root)
  const files = []
  for (const item of await readdir(path.join(root, relative), { withFileTypes: true })) {
    const entry = relative ? `${relative}/${item.name}` : item.name
    if (item.isSymbolicLink()) fail('Snapshot does not support symbolic links or junctions.')
    if (item.isDirectory()) files.push(...(await listArchiveFiles(root, entry)))
    else if (item.isFile()) files.push(entry)
    else fail('Snapshot contains an unsupported filesystem entry.')
  }
  return files.sort()
}

export async function copyUploads(source, destination) {
  try {
    const info = await lstat(source)
    if (!info.isDirectory() || info.isSymbolicLink())
      fail('Upload source must be a real directory.')
  } catch (error) {
    if (error.code === 'ENOENT') return false
    throw error
  }
  const files = await listArchiveFiles(source)
  let total = 0
  await mkdir(destination, { recursive: false, mode: 0o700 })
  for (const entry of files) {
    if (!safeArchiveEntry(`uploads/${entry}`)) fail('Upload filename cannot be archived safely.')
    const sourceFile = path.join(source, ...entry.split('/'))
    await assertNoSymlinkPath(sourceFile)
    const info = await lstat(sourceFile)
    if (!info.isFile() || info.size > 16 * 1024 * 1024)
      fail('Upload source has an invalid or oversized file.')
    total += info.size
    if (total > MAX_ARCHIVE_BYTES - MAX_DATABASE_BYTES)
      fail('Uploads exceed the portable snapshot size limit.')
    const target = path.join(destination, ...entry.split('/'))
    await mkdir(path.dirname(target), { recursive: true, mode: 0o700 })
    await copyFile(sourceFile, target, 1) // COPYFILE_EXCL: never overwrite an existing file.
  }
  return true
}

export async function writeManifest(directory, snapshot, sourceDatabaseHash, uploads) {
  const files = {}
  for (const entry of await listArchiveFiles(directory)) {
    if (!safeArchiveEntry(entry)) fail('Invalid snapshot file entry.')
    files[entry] = sha256(await readFile(path.join(directory, ...entry.split('/'))))
  }
  const manifest = {
    format: SNAPSHOT_FORMAT,
    schemaVersion: snapshot.schemaVersion,
    createdAt: snapshot.createdAt,
    sourceDatabaseHash,
    rowCounts: validateSnapshot(snapshot),
    uploads,
    files,
  }
  await writeFile(path.join(directory, 'manifest.json'), JSON.stringify(manifest, null, 2), {
    flag: 'wx',
    mode: 0o600,
  })
  return manifest
}

export async function verifyArchive(directory) {
  const source = await privateDirectory(directory)
  await assertNoSymlinkPath(source)
  const manifestPath = path.join(source, 'manifest.json')
  const info = await lstat(manifestPath)
  if (!info.isFile() || info.isSymbolicLink() || info.size > 2 * 1024 * 1024)
    fail('Invalid snapshot manifest file.')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  if (
    !keysExactly(manifest, [
      'format',
      'schemaVersion',
      'createdAt',
      'sourceDatabaseHash',
      'rowCounts',
      'uploads',
      'files',
    ]) ||
    manifest.format !== SNAPSHOT_FORMAT ||
    ![2, SCHEMA_VERSION].includes(manifest.schemaVersion) ||
    !validTimestamp(manifest.createdAt) ||
    typeof manifest.sourceDatabaseHash !== 'string' ||
    !/^[a-f0-9]{64}$/.test(manifest.sourceDatabaseHash) ||
    typeof manifest.uploads !== 'boolean' ||
    !keysExactly(manifest.rowCounts, Object.keys(TABLE_COLUMNS)) ||
    !record(manifest.files) ||
    !Object.hasOwn(manifest.files, 'database.json')
  )
    fail('Invalid snapshot manifest.')
  const expectedFiles = Object.keys(manifest.files).sort()
  if (
    expectedFiles.length > 10_000 ||
    expectedFiles.some(
      (entry) =>
        !safeArchiveEntry(entry) ||
        typeof manifest.files[entry] !== 'string' ||
        !/^[a-f0-9]{64}$/.test(manifest.files[entry]) ||
        (!manifest.uploads && entry.startsWith('uploads/')),
    )
  )
    fail('Invalid snapshot file manifest.')
  const actualFiles = (await listArchiveFiles(source)).filter((entry) => entry !== 'manifest.json')
  if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles))
    fail('Snapshot contains missing or unlisted files.')
  const verifiedFiles = new Map()
  let total = 0
  for (const entry of expectedFiles) {
    const filename = path.join(source, ...entry.split('/'))
    await assertNoSymlinkPath(filename)
    const size = (await lstat(filename)).size
    if (size > (entry === 'database.json' ? MAX_DATABASE_BYTES : 16 * 1024 * 1024))
      fail('Snapshot file exceeds the portable size limit.')
    total += size
    if (total > MAX_ARCHIVE_BYTES) fail('Snapshot exceeds the portable size limit.')
    const bytes = await readFile(filename)
    if (sha256(bytes) !== manifest.files[entry])
      fail('Snapshot checksum mismatch; no database writes were performed.')
    verifiedFiles.set(entry, bytes)
  }
  const snapshot = JSON.parse(verifiedFiles.get('database.json').toString('utf8'))
  const counts = validateSnapshot(snapshot)
  if (
    snapshot.createdAt !== manifest.createdAt ||
    snapshot.schemaVersion !== manifest.schemaVersion ||
    Object.keys(TABLE_COLUMNS).some(
      (table) =>
        !Number.isInteger(manifest.rowCounts[table]) || counts[table] !== manifest.rowCounts[table],
    )
  )
    fail('Snapshot row counts or metadata do not match the manifest.')
  return {
    source,
    snapshot,
    manifest: { ...manifest, rowCounts: validateSnapshot(snapshot) },
    verifiedFiles,
    originalSchemaVersion: snapshot.schemaVersion,
  }
}
