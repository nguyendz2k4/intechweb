import { databaseConfigured, getMysqlDatabase, isDuplicateEntry } from './db/mysql-client.mjs'

const developmentCounters = new Map<string, number>()

/** The unique DB key prevents one TOTP from creating multiple sessions across instances. */
export async function consumeAdminTotp(identity: string, counter: number): Promise<boolean> {
  if (databaseConfigured()) {
    const db = getMysqlDatabase()
    try {
      await db.execute(
        'INSERT INTO security_totp_replays (account_hash, counter, expires_at) VALUES (?, ?, UTC_TIMESTAMP(3) + INTERVAL 5 MINUTE)',
        [identity, counter],
      )
    } catch (error) {
      if (isDuplicateEntry(error)) return false
      throw error
    }
    // Indexed expired records are swept opportunistically; never prune an active counter.
    await db.execute('DELETE FROM security_totp_replays WHERE expires_at < UTC_TIMESTAMP(3)')
    return true
  }
  if (process.env.NODE_ENV === 'production')
    throw new Error('Persistent MFA protection unavailable')
  const now = Date.now()
  for (const [key, expiry] of developmentCounters) if (expiry < now) developmentCounters.delete(key)
  const key = `${identity}:${counter}`
  if (developmentCounters.has(key)) return false
  if (developmentCounters.size >= 1000) throw new Error('MFA protection capacity exceeded')
  developmentCounters.set(key, now + 300_000)
  return true
}
