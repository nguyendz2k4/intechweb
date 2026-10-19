import './load-env.mjs'
import { createMysqlDatabase } from '../app/lib/db/mysql-client.mjs'
import { applyMigrations, loadMigrations } from './migrations.mjs'
let db
try {
  db = createMysqlDatabase(
    process.env,
    process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL,
  )
  // MySQL DDL commits implicitly; additive migrations can resume safely.
  const migrations = await loadMigrations()
  await applyMigrations(db, migrations)
  console.log(
    JSON.stringify({
      event: 'migration.completed',
      database: 'mysql',
      sampleProductsInserted: 0,
      migrations: migrations.map((item) => item.name),
    }),
  )
} catch (error) {
  const code = /^[A-Z0-9_]+$/.test(error?.code || '') ? error.code : 'CONFIGURATION_OR_SCHEMA_ERROR'
  console.error(
    `MySQL schema setup failed (${code}). Check DB_* configuration, database user grants and connectivity privately.`,
  )
  process.exitCode = 1
} finally {
  await db?.close()
}
