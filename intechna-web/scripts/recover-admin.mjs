import './load-env.mjs'
import { createMysqlDatabase } from '../app/lib/db/mysql-client.mjs'
let db
try {
  const args = process.argv.slice(2),
    username = args[args.indexOf('--username') + 1]
  if (
    !args.includes('--username') ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_.@-]{2,79}$/.test(username) ||
    args[args.indexOf('--confirm') + 1] !== 'reset-to-owner-secret'
  )
    throw new Error('Confirmation required')
  const accounts = process.env.ADMIN_ACCOUNTS_JSON
    ? JSON.parse(process.env.ADMIN_ACCOUNTS_JSON)
    : [{ username: process.env.ADMIN_USER }]
  if (!Array.isArray(accounts) || !accounts.some((account) => account.username === username))
    throw new Error('Owner unavailable')
  db = createMysqlDatabase(
    process.env,
    process.env.MIGRATION_DATABASE_URL || process.env.DATABASE_URL,
  )
  await db.transaction(async (tx) => {
    await tx.query('SELECT username FROM security_admin_credentials WHERE username=? FOR UPDATE', [
      username,
    ])
    await tx.execute('DELETE FROM security_admin_credentials WHERE username=?', [username])
    await tx.execute('DELETE FROM security_admin_sessions WHERE username=?', [username])
  })
  console.log(
    'Account restored to owner-managed initial credentials; existing sessions revoked. Verify MFA login, then change password/MFA.',
  )
} catch {
  console.error(
    'Recovery failed. Supply owner configuration, username and --confirm reset-to-owner-secret privately.',
  )
  process.exitCode = 1
} finally {
  await db?.close()
}
