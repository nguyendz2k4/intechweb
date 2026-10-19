import assert from 'node:assert/strict'
import { test } from 'node:test'
import { applyMigrations, loadMigrations } from '../scripts/migrations.mjs'
import {
  SCHEMA_VERSION,
  SNAPSHOT_FORMAT,
  TABLE_NAMES,
  validateSnapshot,
} from '../scripts/mysql-snapshot.mjs'

test('new schema adds only nullable fields and supports safe retry of partial DDL', async () => {
  const migrations = await loadMigrations()
  const changes = migrations.find((item) => item.name === '0002_product_price_warranty_model.sql')
  assert.equal(changes.statements.length, 2)
  assert.ok(
    changes.statements.every((sql) => /^ALTER TABLE (products|warranty) ADD COLUMN/.test(sql)),
  )
  let attempts = 0
  const db = {
    execute: async () => {
      attempts++
      if (attempts === 1) throw Object.assign(new Error('exists'), { code: 'ER_DUP_FIELDNAME' })
    },
    query: async () => [{ DATA_TYPE: 'bigint', IS_NULLABLE: 'YES' }],
  }
  await applyMigrations(db, [changes])
  assert.equal(attempts, 2)
  await assert.rejects(
    () =>
      applyMigrations(
        {
          ...db,
          execute: async () => {
            throw Object.assign(new Error('denied'), { code: 'ER_TABLEACCESS_DENIED_ERROR' })
          },
        },
        [changes],
      ),
    /denied/,
  )
  await assert.rejects(
    () =>
      applyMigrations(
        {
          execute: async () => {
            throw Object.assign(new Error('wrong type'), { code: 'ER_DUP_FIELDNAME' })
          },
          query: async () => [{ DATA_TYPE: 'int', IS_NULLABLE: 'YES' }],
        },
        [changes],
      ),
    /wrong type/,
  )
})
test('old backups remain readable while new backups validate price and model', () => {
  const tables = Object.fromEntries(TABLE_NAMES.map((table) => [table, []]))
  const old = {
    format: SNAPSHOT_FORMAT,
    schemaVersion: 2,
    createdAt: '2026-10-18T01:00:00Z',
    tables,
  }
  tables.warranty.push({
    id: 1,
    code: 'INTECH-2024-ABC123ABC123',
    serial: 'SERIAL001',
    product: 'Legacy model',
    customer: 'Owner',
    purchase_date: null,
    warranty_until: null,
    status: null,
    note: null,
  })
  assert.equal(validateSnapshot(old).warranty, 1)
  tables.warranty[0].model = 'New model'
  assert.equal(validateSnapshot({ ...old, schemaVersion: SCHEMA_VERSION }).warranty, 1)
})
