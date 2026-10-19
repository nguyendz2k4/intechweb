import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { sqlStatements } from '../scripts/sql-statements.mjs'
import { mysqlOptions, isDuplicateEntry } from '../app/lib/db/mysql-client.mjs'
import { grantsAllow } from '../app/lib/health-check.ts'
test('MariaDB schema creates all tables without importing demo content', async () => {
  const source = await readFile(new URL('../drizzle/0001_mysql.sql', import.meta.url), 'utf8')
  const statements = sqlStatements(source)
  assert.equal(statements.length, 9)
  assert.ok(statements.every((statement) => /CREATE TABLE IF NOT EXISTS/.test(statement)))
  assert.ok(!/INSERT INTO/i.test(source))
  assert.ok(statements.every((statement) => /InnoDB/.test(statement)))
})
test('cPanel connection parser accepts DB fields and encoded URLs, rejects PostgreSQL and unsafe options', () => {
  const options = mysqlOptions({
    DB_HOST: '103.57.221.79',
    DB_PORT: '3306',
    DB_NAME: 'qnvlpdarhosting_site',
    DB_USER: 'qnvlpdarhosting_user',
    DB_PASSWORD: 'private',
  })
  assert.equal(options.database, 'qnvlpdarhosting_site')
  assert.equal(options.timezone, 'Z')
  assert.equal(options.connectionLimit, 5)
  assert.equal(options.multipleStatements, false)
  assert.equal(mysqlOptions({}, 'mysql://user:p%40ss@localhost:3306/site').password, 'p@ss')
  for (const url of [
    'invalid',
    'postgresql://user:pass@host/site',
    'http://host/site',
    'mysql://user:pass@host/site?multipleStatements=true',
  ])
    assert.throws(() => mysqlOptions({}, url))
  assert.throws(() =>
    mysqlOptions({
      DB_HOST: 'localhost',
      DB_NAME: 'site',
      DB_USER: 'owner',
      NODE_ENV: 'production',
    }),
  )
  assert.equal(isDuplicateEntry({ cause: { code: 'ER_DUP_ENTRY' } }), true)
  assert.equal(isDuplicateEntry({ code: 'ER_DATA_TOO_LONG' }), false)
})
test('health privilege checks support cPanel database grants without mixing other databases', () => {
  const grants = [
    'GRANT USAGE ON *.* TO `user`@`localhost`',
    'GRANT ALL PRIVILEGES ON `qnvlpdarhosting_site`.* TO `user`@`localhost`',
  ]
  assert.equal(grantsAllow(grants, 'qnvlpdarhosting_site', 'products', 'UPDATE'), true)
  assert.equal(
    grantsAllow(
      ['GRANT ALL PRIVILEGES ON `qnvlpdarhosting\\_site`.* TO `user`@`localhost`'],
      'qnvlpdarhosting_site',
      'products',
      'UPDATE',
    ),
    true,
  )
  assert.equal(grantsAllow(grants, 'other', 'products', 'UPDATE'), false)
  assert.equal(
    grantsAllow(
      ['GRANT SELECT ON `site`.`products` TO `user`@`localhost`'],
      'site',
      'products',
      'INSERT',
    ),
    false,
  )
})
