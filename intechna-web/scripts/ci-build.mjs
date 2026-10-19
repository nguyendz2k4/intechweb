import { spawn } from 'node:child_process'
import { cp, mkdtemp, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fixtureDatabaseUrl } from './ci-build-fixture.mjs'

const sourceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const temporaryRoot = await realpath(tmpdir())
const stage = await mkdtemp(join(temporaryRoot, 'intechna-ci-build-'))
const excludedRoots = new Set([
  'node_modules',
  '.next',
  '.git',
  '.agents',
  '.codex',
  '.secrets',
  '.vercel',
  'release',
  'releases',
  'backups',
  'scratch',
  'docs',
  'data',
])

try {
  // Turbopack refuses dependency symlinks outside its project root. A private
  // copy preserves the normal production compiler and its resolution behavior.
  console.log('Preparing isolated dependencies for the production compiler...')
  await cp(join(sourceRoot, 'node_modules'), join(stage, 'node_modules'), {
    recursive: true,
    dereference: true,
  })
  // Next loads .env files itself. Copying to a clean directory keeps local and
  // production credentials out of the build, including environment file values.
  await cp(sourceRoot, stage, {
    recursive: true,
    filter: (path) => {
      const parts = relative(sourceRoot, path).split(sep)
      return (
        !excludedRoots.has(parts[0]) &&
        !(parts[0] === 'public' && parts[1] === 'uploads') &&
        !parts.some(
          (part) =>
            part.startsWith('.env') ||
            ['.secrets', '.vercel', '.npmrc', '.git-credentials'].includes(part) ||
            /\.(tsbuildinfo|log|zip)$/i.test(part),
        )
      )
    },
  })
  const env = {}
  const connectorPath = join(stage, 'app/lib/db/mysql-client.mjs')
  const connector = await readFile(connectorPath, 'utf8')
  const factory = /export function getMysqlPool\(\) \{[\s\S]*?\n\}/
  if (!factory.test(connector)) throw new Error('CI database connector factory was not found')
  // Replace only the pool factory in the temporary checkout. Keep the real
  // connector types and transaction code so the compiler checks the same API.
  await writeFile(
    connectorPath,
    "import { fixturePool } from '../../../scripts/ci-build-fixture.mjs'\n" +
      connector.replace(
        factory,
        `export function getMysqlPool() {
      applicationPool ??= /** @type {import('mysql2/promise').Pool} */ (/** @type {unknown} */ (fixturePool()))
      return applicationPool
    }`,
      ),
  )
  for (const name of [
    'PATH',
    'Path',
    'SystemRoot',
    'WINDIR',
    'COMSPEC',
    'PATHEXT',
    'TEMP',
    'TMP',
    'HOME',
    'USERPROFILE',
  ])
    if (process.env[name]) env[name] = process.env[name]
  Object.assign(env, {
    CI: 'true',
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
    DATABASE_URL: fixtureDatabaseUrl,
    NEXT_PUBLIC_SITE_URL: 'https://ci-build.invalid',
    ADMIN_ENABLED: 'false',
    CONTACT_ENABLED: 'false',
    UPLOADS_ENABLED: 'false',
    CI_EMPTY_CATALOG: 'true',
  })
  console.log(
    'Building isolated source with deterministic public fixtures; no live database is used.',
  )
  const child = spawn(process.execPath, [join(stage, 'node_modules/next/dist/bin/next'), 'build'], {
    cwd: stage,
    env,
    stdio: 'inherit',
  })
  const exitCode = await new Promise((resolveExit, reject) => {
    child.on('error', reject)
    child.on('exit', (code, signal) =>
      signal ? reject(new Error(`CI build interrupted by ${signal}`)) : resolveExit(code ?? 1),
    )
  })
  process.exitCode = exitCode
} finally {
  const resolvedStage = resolve(stage)
  if (
    dirname(resolvedStage) !== temporaryRoot ||
    !resolvedStage.startsWith(join(temporaryRoot, 'intechna-ci-build-'))
  )
    throw new Error('Refusing to remove a CI build directory outside the expected temporary root')
  await rm(resolvedStage, { recursive: true, force: true })
}
