import './load-env.mjs'
import { createMysqlDatabase } from '../app/lib/db/mysql-client.mjs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import {
  MAX_DATABASE_BYTES,
  SCHEMA_VERSION,
  SNAPSHOT_FORMAT,
  TABLE_NAMES,
  TABLE_COLUMNS,
  copyUploads,
  databaseIdentity,
  privateDirectory,
  sha256,
  validateSnapshot,
  verifyArchive,
  writeManifest,
} from './mysql-snapshot.mjs'
let db
try {
  const connection = process.env.BACKUP_DATABASE_URL || process.env.DATABASE_URL
  const sourceDatabaseHash = sha256(databaseIdentity(connection || process.env))
  const outputRoot = await privateDirectory(process.argv[2] || 'backups')
  db = createMysqlDatabase(process.env, connection)
  const tables = await db.transaction(
    async (tx) => {
      const result = {}
      for (const table of TABLE_NAMES) {
        const columns = TABLE_COLUMNS[table]
        const rows = await tx.query(
          'SELECT ' +
            Object.keys(columns).join(',') +
            ' FROM ' +
            table +
            ' ORDER BY ' +
            (columns.id ? 'id' : 'username'),
        )
        result[table] = rows.map((row) =>
          Object.fromEntries(
            Object.entries(row).map(([key, value]) => [
              key,
              value instanceof Date
                ? value.toISOString()
                : columns[key].startsWith('array') && typeof value === 'string'
                  ? JSON.parse(value)
                  : value,
            ]),
          ),
        )
      }
      return result
    },
    { readOnly: true, isolation: 'REPEATABLE READ' },
  )
  const snapshot = {
    format: SNAPSHOT_FORMAT,
    schemaVersion: SCHEMA_VERSION,
    createdAt: new Date().toISOString(),
    tables,
  }
  const rowCounts = validateSnapshot(snapshot),
    bytes = Buffer.from(JSON.stringify(snapshot, null, 2))
  if (bytes.length > MAX_DATABASE_BYTES) throw new Error('Backup too large')
  const directory = path.join(
    outputRoot,
    'intechna-mysql-' + new Date().toISOString().replace(/[:.]/g, '-'),
  )
  await mkdir(directory, { recursive: false, mode: 0o700 })
  await writeFile(path.join(directory, 'database.json'), bytes, { flag: 'wx', mode: 0o600 })
  const uploads = await copyUploads(path.resolve('public/uploads'), path.join(directory, 'uploads'))
  await writeManifest(directory, snapshot, sourceDatabaseHash, uploads)
  await verifyArchive(directory)
  console.log(JSON.stringify({ event: 'backup.mysql_verified', directory, rowCounts, uploads }))
  console.log(
    'Keep this confidential backup and credential encryption key in owner storage. Sessions and temporary MFA/rate state are excluded.',
  )
} catch {
  console.error(
    'MySQL backup failed. Check configuration privately; incomplete archives must not be used.',
  )
  process.exitCode = 1
} finally {
  await db?.close()
}
