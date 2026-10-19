import { randomBytes, scryptSync } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { privateDirectory } from './mysql-snapshot.mjs'
try {
  const args = process.argv.slice(2)
  const option = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined)
  const username = option('--username'),
    role = option('--role') || 'admin',
    origin = option('--origin')
  if (
    !args.includes('--username') ||
    !/^[a-zA-Z0-9][a-zA-Z0-9_.@-]{2,79}$/.test(username) ||
    !['admin', 'editor', 'support'].includes(role)
  )
    throw new Error('invalid account')
  if (!args.includes('--origin')) throw new Error('origin required')
  const url = new URL(origin)
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error('HTTPS origin required')
  const password = randomBytes(24).toString('base64url'),
    salt = randomBytes(16)
  const key = scryptSync(password, salt, 64, { N: 131072, r: 8, p: 1, maxmem: 160 * 1024 * 1024 })
  const passwordHash = `scrypt$131072$8$1$${salt.toString('base64url')}$${key.toString('base64url')}`
  let bits = 0,
    value = 0,
    secret = ''
  for (const byte of randomBytes(20)) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      bits -= 5
      secret += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'[(value >>> bits) & 31]
    }
  }
  const directory = await privateDirectory('data/owner')
  await mkdir(directory, { recursive: true, mode: 0o700 })
  // One private file per account, exclusive creation; never rotate or overwrite implicitly.
  await writeFile(
    `${directory}/account-${username}.txt`,
    `PRIVATE OWNER HANDOVER — keep in owner password manager, never in public/uploads or Git.\nUsername: ${username}\nInitial password: ${password}\nAuthenticator setup key: ${secret}\nAuthenticator URI: otpauth://totp/${encodeURIComponent(`Intech:${username}`)}?secret=${secret}&issuer=Intech&algorithm=SHA1&digits=6&period=30\n\nAdd this account to ADMIN_ACCOUNTS_JSON in owner secret storage:\n${JSON.stringify({ username, role, passwordHash, totpSecret: secret })}\n\nInitial configuration for a NEW installation only (do not replace existing shared keys):\nADMIN_TRUSTED_ORIGINS=${url.origin}\nADMIN_SESSION_SECRET=${randomBytes(48).toString('base64url')}\nADMIN_CREDENTIAL_ENCRYPTION_KEY=${randomBytes(48).toString('base64url')}\nHEALTHCHECK_TOKEN=${randomBytes(48).toString('base64url')}\n\nTest TOTP login before handover; keep an independent owner device/maintenance recovery path. Self-service changes live in encrypted DB credentials. Recover only with recover-admin.mjs and maintenance credentials, then change password/MFA again. Preserve encryption key with backups; rotating it needs explicit re-enrollment.\n`,
    { flag: 'wx', mode: 0o600 },
  )
  console.log(
    'Owner account bundle created privately under data/owner; no credentials printed. Add account JSON to owner secret storage and verify MFA login.',
  )
} catch {
  console.error(
    'Setup failed. Use --username <name> --role admin|editor|support --origin https://<admin-host>; existing account files are never overwritten.',
  )
  process.exitCode = 1
}
