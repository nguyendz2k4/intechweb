import type { getMysqlDatabase } from './db/mysql-client.mjs'
export const requiredPrivileges: Record<string, string[]> = {
  products: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  posts: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  services: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  warranty: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  contact_submissions: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  security_rate_limits: ['SELECT', 'INSERT', 'UPDATE'],
  security_totp_replays: ['SELECT', 'INSERT', 'DELETE'],
  security_admin_sessions: ['SELECT', 'INSERT', 'UPDATE', 'DELETE'],
  security_admin_credentials: ['SELECT', 'INSERT', 'UPDATE'],
}
export function grantsAllow(grants: string[], database: string, table: string, permission: string) {
  return grants.some((grant) => {
    const match = /^GRANT (.+?) ON (\S+) TO /i.exec(grant)
    if (!match) return false
    const scope = match[2]
      .replaceAll('`', '')
      .replace(/\\([_%])/g, '$1')
      .split('.')
    if (
      scope.length !== 2 ||
      !['*', database].includes(scope[0]) ||
      !['*', table].includes(scope[1])
    )
      return false
    const allowed = match[1].split(',').map((value) => value.trim().toUpperCase())
    return allowed.includes('ALL PRIVILEGES') || allowed.includes(permission)
  })
}
export async function checkHealthDatabase(db: ReturnType<typeof getMysqlDatabase>) {
  return db.transaction(
    async (tx) => {
      const identity = await tx.query<{ name: string }>('SELECT DATABASE() AS name')
      const grants = (
        await tx.query<Record<string, string>>('SHOW GRANTS FOR CURRENT_USER')
      ).flatMap((row) => Object.values(row))
      const probes = [
        'SELECT status, price_vnd FROM products LIMIT 0',
        'SELECT status FROM posts LIMIT 0',
        'SELECT status, deliverables, benefits FROM services LIMIT 0',
        'SELECT code, model FROM warranty LIMIT 0',
        'SELECT status FROM contact_submissions LIMIT 0',
        'SELECT bucket_hash, count, expires_at FROM security_rate_limits LIMIT 0',
        'SELECT account_hash, counter, expires_at FROM security_totp_replays LIMIT 0',
        'SELECT version, pending_totp, pending_expires_at FROM security_admin_sessions LIMIT 0',
        'SELECT password_hash, totp_encrypted, revision FROM security_admin_credentials LIMIT 0',
      ]
      for (const query of probes) await tx.query(query)
      return (
        !!identity[0]?.name &&
        Object.entries(requiredPrivileges).every(([table, permissions]) =>
          permissions.every((permission) =>
            grantsAllow(grants, identity[0].name, table, permission),
          ),
        )
      )
    },
    { readOnly: true },
  )
}
