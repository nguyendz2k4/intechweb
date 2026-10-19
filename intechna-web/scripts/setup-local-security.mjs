import { randomBytes } from 'node:crypto'
import { readFile, writeFile } from 'node:fs/promises'
try {
  if (!process.argv.includes('--development')) throw new Error('Development only')
  const filename = new URL('../.env', import.meta.url)
  let source = await readFile(filename, 'utf8'),
    added = 0
  for (const name of ['ADMIN_CREDENTIAL_ENCRYPTION_KEY', 'HEALTHCHECK_TOKEN']) {
    if (!new RegExp(`^${name}=.+$`, 'm').test(source)) {
      source = source.replace(new RegExp(`^${name}=.*(?:\r?\n|$)`, 'm'), '')
      source += `\n${name}=${randomBytes(48).toString('base64url')}\n`
      added++
    }
  }
  if (added) await writeFile(filename, source, { mode: 0o600 })
  console.log(
    `Development security setup checked; ${added} missing keys created privately. Existing keys preserved.`,
  )
} catch {
  console.error('Local setup failed. --development and private .env required.')
  process.exitCode = 1
}
