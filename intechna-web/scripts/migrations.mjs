import { lstat, readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { sqlStatements } from './sql-statements.mjs'

const sourceDirectory = fileURLToPath(new URL('../drizzle/', import.meta.url))
const migrationName = /^\d{4}_[a-z][a-z0-9_]*\.sql$/

/** Each additive column migration may be safely resumed after an implicit DDL commit. */
export async function applyMigrations(db, migrations) {
  for (const migration of migrations) {
    for (const statement of migration.statements) {
      try {
        await db.execute(statement)
      } catch (error) {
        if (
          migration.name !== '0002_product_price_warranty_model.sql' ||
          error?.code !== 'ER_DUP_FIELDNAME'
        )
          throw error
        // Do not silently accept a column with an incompatible pre-existing definition.
        const match = /^ALTER TABLE (products|warranty) ADD COLUMN (price_vnd|model) /i.exec(
          statement,
        )
        if (!match) throw error
        const columns = await db.query(
          'SELECT DATA_TYPE, IS_NULLABLE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?',
          [match[1], match[2]],
        )
        if (
          columns.length !== 1 ||
          columns[0].DATA_TYPE !== (match[2] === 'price_vnd' ? 'bigint' : 'text') ||
          columns[0].IS_NULLABLE !== 'YES'
        )
          throw error
      }
    }
  }
}

/** Load repository migrations only; a backup never supplies executable SQL. */
export async function loadMigrations(directory = sourceDirectory) {
  const root = path.resolve(directory)
  const rootInfo = await lstat(root)
  if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink())
    throw new Error('Migration source must be a real directory.')
  const names = (await readdir(root)).filter((name) => migrationName.test(name)).sort()
  if (!names.length || !names[0].startsWith('0001_'))
    throw new Error('The trusted baseline migration is required.')
  const sequences = new Set()
  const migrations = []
  for (const name of names) {
    const sequence = name.slice(0, 4)
    if (sequences.has(sequence)) throw new Error('Migration sequence numbers must be unique.')
    sequences.add(sequence)
    const filename = path.join(root, name)
    const info = await lstat(filename)
    if (!info.isFile() || info.isSymbolicLink() || info.size > 1024 * 1024)
      throw new Error('Migration source must be a bounded regular file.')
    const statements = sqlStatements(await readFile(filename, 'utf8'))
    if (!statements.length) throw new Error('Migration source must not be empty.')
    migrations.push({ name, statements })
  }
  return migrations
}
