import { lstat, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { assertNoCredentials, hashFile, safeSourcePath, sourceFiles } from './handover-files.mjs'

export async function verifyHandover(directory) {
  const root = path.resolve(directory)
  const rootInfo = await lstat(root)
  const manifestPath = path.join(root, 'handover-manifest.json')
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink())
    throw new Error('Handover root must be a real directory.')
  const manifestInfo = await lstat(manifestPath)
  if (!manifestInfo.isFile() || manifestInfo.isSymbolicLink())
    throw new Error('Handover manifest must be a regular file, not a link.')
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
  if (
    manifest.format !== 'intechna-source-handover' ||
    manifest.version !== 1 ||
    !manifest.files ||
    typeof manifest.files !== 'object' ||
    Array.isArray(manifest.files)
  )
    throw new Error('Invalid handover manifest.')
  const required = [
    'BAT-DAU.md',
    '.github/workflows/quality.yml',
    ...sourceFiles.map((name) => `intechna-web/${name}`),
    'intechna-web/app/layout.tsx',
    'intechna-web/app/lib/db/index.ts',
    'intechna-web/app/api/admin/auth/login/route.ts',
  ]
  if (required.some((name) => !Object.hasOwn(manifest.files, name)))
    throw new Error('Required handover source files are missing from the manifest.')
  const expected = new Set(['handover-manifest.json', ...Object.keys(manifest.files)])
  const names = []
  async function walk(relative = '') {
    for (const item of await readdir(path.join(root, relative), { withFileTypes: true })) {
      const name = relative ? `${relative}/${item.name}` : item.name
      const info = await lstat(path.join(root, ...name.split('/')))
      if (info.isSymbolicLink()) throw new Error('Links are not allowed in the source handover.')
      if (info.isDirectory()) await walk(name)
      else if (info.isFile()) names.push(name)
      else throw new Error('Only regular files are allowed.')
    }
  }
  await walk()
  for (const name of names) {
    if (!expected.has(name)) throw new Error(`Unlisted handover file: ${name}`)
    if (name === 'handover-manifest.json') continue
    const allowed =
      name === 'BAT-DAU.md' ||
      name === '.github/workflows/quality.yml' ||
      (name.startsWith('intechna-web/') && safeSourcePath(name.slice('intechna-web/'.length)))
    if (!allowed) throw new Error(`Unapproved handover file: ${name}`)
    const bytes = await readFile(path.join(root, ...name.split('/')))
    assertNoCredentials(name, bytes)
    if (manifest.files[name] !== (await hashFile(path.join(root, ...name.split('/')))))
      throw new Error(`Changed handover file: ${name}`)
    expected.delete(name)
  }
  expected.delete('handover-manifest.json')
  if (expected.size) throw new Error('Handover files are missing.')
  return { verified: true, fileCount: names.length - 1 }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  verifyHandover(process.argv[2] ?? '.')
    .then((report) => console.log(JSON.stringify(report)))
    .catch((error) => {
      console.error(error.message)
      process.exitCode = 1
    })
}
