import 'dotenv/config'
import { randomBytes } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

if (!process.argv.includes('--development') || process.env.NODE_ENV === 'production') {
  console.error('Only the explicitly selected development environment can use this helper.')
  process.exit(1)
}
const username = /^[a-zA-Z0-9][a-zA-Z0-9_.@-]{2,79}$/.test(process.env.ADMIN_USER ?? '')
  ? process.env.ADMIN_USER
  : 'owner-local'
const password = randomBytes(24).toString('base64url')
const envFile = new URL('../.env', import.meta.url)
let source = await readFile(envFile, 'utf8')
for (const [name, value] of [
  ['ADMIN_USER', username],
  ['ADMIN_PASSWORD', password],
]) {
  const pattern = new RegExp(`^${name}=.*$`, 'm')
  source = pattern.test(source)
    ? source.replace(pattern, `${name}=${value}`)
    : `${source}\n${name}=${value}\n`
}
await mkdir(new URL('../data/owner/', import.meta.url), { recursive: true, mode: 0o700 })
await writeFile(
  new URL('../data/owner/admin-local-access.txt', import.meta.url),
  `Development admin access only — excluded from Git.\nURL=http://localhost:3000/admin-login\nUsername=${username}\nPassword=${password}\n\nStart npm run dev with the local .env.\nProduction requires owner-managed MFA accounts and separate secrets.\n`,
  { mode: 0o600 },
)
await writeFile(envFile, source, { mode: 0o600 })
console.log(
  'Strong development credentials saved privately to data/owner/admin-local-access.txt; no credentials printed.',
)
