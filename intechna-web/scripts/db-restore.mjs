import './load-env.mjs'
import { createMysqlDatabase } from '../app/lib/db/mysql-client.mjs'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { applyMigrations, loadMigrations } from './migrations.mjs'
import {
  TABLE_NAMES,
  TABLE_COLUMNS,
  assertRestoreTarget,
  privateDirectory,
  verifyArchive,
} from './mysql-snapshot.mjs'
let db
try {
  if (!process.argv[2]) throw new Error('Backup directory required')
  const archive = await verifyArchive(process.argv[2])
  const connection = assertRestoreTarget(process.env, archive.manifest.sourceDatabaseHash)
  db = createMysqlDatabase(process.env, connection)
  const existing = await db.query(
    'SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()',
  )
  if (existing.length) throw new Error('Restore requires an empty isolated database')
  const migrations = await loadMigrations()
  await applyMigrations(db, migrations)
  await db.transaction(async (tx) => {
    for (const table of TABLE_NAMES) {
      const columns = Object.keys(TABLE_COLUMNS[table])
      const statement =
        'INSERT INTO ' +
        table +
        ' (' +
        columns.join(',') +
        ') VALUES (' +
        columns.map(() => '?').join(',') +
        ')'
      for (const row of archive.snapshot.tables[table]) {
        const values = columns.map((column) => {
          const value = row[column] ?? null,
            type = TABLE_COLUMNS[table][column]
          return Array.isArray(value)
            ? JSON.stringify(value)
            : type.startsWith('timestamp') && value !== null
              ? new Date(value)
              : value
        })
        await tx.execute(statement, values)
      }
      const count = await tx.query('SELECT count(*) AS count FROM ' + table)
      if (Number(count[0]?.count) !== archive.manifest.rowCounts[table])
        throw new Error('Restored counts mismatch')
    }
  })
  const output = await privateDirectory('backups'),
    reviewDirectory = path.join(output, 'restore-review-mysql-' + Date.now())
  await mkdir(reviewDirectory, { recursive: false, mode: 0o700 })
  for (const [entry, bytes] of archive.verifiedFiles)
    if (entry.startsWith('uploads/')) {
      const filename = path.join(reviewDirectory, ...entry.split('/'))
      await mkdir(path.dirname(filename), { recursive: true, mode: 0o700 })
      await writeFile(filename, bytes, { flag: 'wx', mode: 0o600 })
    }
  console.log(
    JSON.stringify({
      event: 'restore.mysql_verified',
      rowCounts: archive.manifest.rowCounts,
      reviewDirectory,
    }),
  )
  console.log(
    'Keep the target isolated for verification. Transient sessions/MFA/rate state start empty; media is staged for review.',
  )
} catch {
  console.error(
    'MySQL restore failed. Use a verified archive and a distinct empty development/staging database; inspect the target privately.',
  )
  process.exitCode = 1
} finally {
  await db?.close()
}
