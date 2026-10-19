import { createHash } from 'node:crypto'
import { lstat, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'

// An allowlist, not a Git archive: uncommitted source is included, local account state is not.
export const sourceDirectories = [
  'app',
  'components',
  'drizzle',
  'scripts',
  'tests',
  'docs/handover',
]
export const sourceFiles = [
  'package.json',
  'package-lock.json',
  'tsconfig.json',
  'next-env.d.ts',
  'next.config.ts',
  'app.js',
  'server.js',
  'CPANEL-MYSQL.md',
  'proxy.ts',
  'postcss.config.mjs',
  'drizzle.config.ts',
  'eslint.config.mjs',
  '.prettierrc.json',
  '.prettierignore',
  '.gitignore',
  '.env.example',
  '.dockerignore',
  'Dockerfile',
  'compose.yaml',
  'README.md',
  'HANDOVER-CHECKLIST.md',
  'DEPLOYMENT-SECURITY.md',
  'AGENTS.md',
  'data/content.example.json',
  'public/favicon.svg',
  'public/favicon.ico',
  'public/favicon-48.png',
  'public/apple-touch-icon.png',
  'public/logo.svg',
  'public/templates/bao-hanh.csv',
  'public/uploads/images/README.md',
  'public/uploads/datasheets/README.md',
]

export function safeSourcePath(name) {
  if (
    typeof name !== 'string' ||
    !name ||
    name.includes('\\') ||
    name.startsWith('/') ||
    name.split('/').some((part) => !part || part === '.' || part === '..' || part.includes(':'))
  )
    return false
  if (sourceFiles.includes(name)) return true
  if (
    name
      .split('/')
      .some((part) => part.startsWith('.') || part === 'owner' || part === 'node_modules')
  )
    return false
  if (name.startsWith('public/images/')) return /\.(?:webp|png|jpe?g|svg|md)$/.test(name)
  if (name.startsWith('docs/handover/')) return /\.(?:md|sql)$/.test(name)
  if (name.startsWith('drizzle/'))
    return (
      name.split('/').length === 2 && /^\d{4}_[a-z][a-z0-9_]*\.sql$/.test(path.posix.basename(name))
    )
  return (
    sourceDirectories.some((root) => name.startsWith(`${root}/`)) &&
    /\.(?:tsx?|mjs|css|ps1)$/.test(name)
  )
}

export async function collectSourceFiles(root) {
  const result = []
  async function add(name) {
    if (!safeSourcePath(name)) throw new Error(`Unapproved handover path: ${name}`)
    const info = await lstat(path.join(root, ...name.split('/')))
    if (info.isSymbolicLink() || !info.isFile())
      throw new Error('Handover source must be regular files.')
    result.push(name)
  }
  async function walk(directory) {
    const info = await lstat(path.join(root, ...directory.split('/')))
    if (info.isSymbolicLink() || !info.isDirectory())
      throw new Error('Handover directories must not be links.')
    for (const item of await readdir(path.join(root, ...directory.split('/')), {
      withFileTypes: true,
    })) {
      const name = `${directory}/${item.name}`
      if (item.isSymbolicLink()) throw new Error('Handover does not follow links.')
      if (item.isDirectory()) await walk(name)
      else await add(name)
    }
  }
  for (const name of sourceFiles) await add(name)
  for (const directory of [...sourceDirectories, 'public/images']) await walk(directory)
  return result.sort()
}

export async function hashFile(filename) {
  return createHash('sha256')
    .update(await readFile(filename))
    .digest('hex')
}

export function assertNoCredentials(name, bytes) {
  if (!/\.(?:tsx?|m?js|json|md|ya?ml|sql|css)$/.test(name) && !name.endsWith('.env.example')) return
  const source = bytes.toString('utf8')
  // Synthetic test/example URLs are permitted. Real connection credentials and common API keys are not.
  for (const match of source.matchAll(/(?:mysql|postgres(?:ql)?):\/\/[^\s'"`<>]+/g)) {
    let url
    try {
      url = new URL(match[0].replace(/[),;]+$/, ''))
    } catch {
      continue
    }
    const example =
      url.hostname.endsWith('.test') ||
      url.hostname.endsWith('.invalid') ||
      url.hostname === 'db.example' ||
      url.hostname === 'db.example.test' ||
      ['localhost', '127.0.0.1'].includes(url.hostname)
    if (!example && (url.username || url.password))
      throw new Error(`Credential-like database URL in ${name}`)
  }
  if (/\b(?:re_[A-Za-z0-9]{24,}|sk_live_[A-Za-z0-9]{20,}|vercel_[A-Za-z0-9]{24,})\b/.test(source))
    throw new Error(`Credential-like API key in ${name}`)
}
