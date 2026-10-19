import './load-env.mjs'
import { createMysqlDatabase } from '../app/lib/db/mysql-client.mjs'
let db
try {
  db = createMysqlDatabase(
    process.env,
    process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL,
  )
  await db.transaction(async (tx) => {
    await tx.execute(
      'DELETE FROM security_rate_limits WHERE expires_at < UTC_TIMESTAMP(3) - INTERVAL 1 DAY',
    )
    await tx.execute('DELETE FROM security_totp_replays WHERE expires_at < UTC_TIMESTAMP(3)')
    await tx.execute('DELETE FROM security_admin_sessions WHERE expires_at < UTC_TIMESTAMP(3)')
  })
  console.log('Expired rate, replay and session state removed; durable credentials preserved.')
} catch {
  console.error('Cleanup failed. Check maintenance configuration privately.')
  process.exitCode = 1
} finally {
  await db?.close()
}
