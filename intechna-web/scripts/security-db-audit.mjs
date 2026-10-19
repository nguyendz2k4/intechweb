import './load-env.mjs'
import { createMysqlDatabase } from '../app/lib/db/mysql-client.mjs'
let db
try {
  db = createMysqlDatabase()
  const version = await db.query('SELECT VERSION() AS version')
  const tables = await db.query(
    'SELECT TABLE_NAME AS name, ENGINE AS engine FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE()',
  )
  const counts = await db.query(
    'SELECT (SELECT count(*) FROM products) AS products, (SELECT count(*) FROM posts) AS posts, (SELECT count(*) FROM services) AS services, (SELECT count(*) FROM warranty) AS warranty, (SELECT count(*) FROM contact_submissions) AS contacts',
  )
  console.log(
    JSON.stringify(
      { database: { version: version[0]?.version, tables, counts: counts[0] } },
      null,
      2,
    ),
  )
} catch (error) {
  const code = /^[A-Z0-9_]+$/.test(error?.code || '') ? error.code : 'CONFIGURATION_OR_SCHEMA_ERROR'
  console.error(`MySQL audit failed (${code}). Check configuration and schema privately.`)
  process.exitCode = 1
} finally {
  await db?.close()
}
