import assert from 'node:assert/strict'
import { test } from 'node:test'
import { validateWarrantyImport } from '../app/lib/warranty-import'

test('batch import locks serials, inserts atomically, skips duplicates and rolls back failures', async () => {
  const previous = process.env.DATABASE_URL
  process.env.DATABASE_URL = 'mysql://fixture:fixture@warranty-import.invalid/test'
  const { db } = await import('../app/lib/db')
  const { importWarrantyRecords } = await import('../app/lib/db/queries')
  if (previous === undefined) delete process.env.DATABASE_URL
  else process.env.DATABASE_URL = previous
  const original = db.$client.getConnection
  const statements: string[] = []
  let existing: string[] = ['OLD00001']
  let fail = false
  const query = async (options: { sql: string } | string, params: unknown[] = []) => {
    const sql = typeof options === 'string' ? options : options.sql
    statements.push(sql)
    if (sql.startsWith('select')) return [existing.map((serial) => [serial]), []]
    if (sql.startsWith('insert')) {
      assert.ok(!sql.includes('NEW00001'))
      assert.ok(params.includes('Model 1'))
      assert.ok(params.some((p) => typeof p === 'string' && /^INT-[A-F0-9]{12}$/.test(p)))
      if (fail) throw new Error('insert failure')
      existing = [...existing, 'NEW00001']
    }
    return [{ affectedRows: 1 }, []]
  }
  db.$client.getConnection = (async () => ({
    release: () => {},
    query,
  })) as unknown as typeof original
  const entry = {
    serial: 'NEW00001',
    product: 'RAM',
    model: 'Model 1',
    customer: 'Owner',
    purchaseDate: '2024-01-01',
    warrantyUntil: '2025-01-01',
  }
  const { lines } = validateWarrantyImport({
    action: 'commit',
    rows: [entry, { ...entry, serial: 'old00001' }],
  })
  try {
    const preview = await importWarrantyRecords(lines, false)
    assert.equal(preview.newCount, 1)
    assert.ok(!statements.some((s) => /for update|^insert/.test(s)))
    statements.length = 0
    const saved = await importWarrantyRecords(lines, true)
    assert.deepEqual([saved.created, saved.duplicateCount], [1, 1])
    assert.ok(statements.some((s) => s.endsWith('for update')))
    assert.equal(statements.at(-1), 'commit')
    assert.equal((await importWarrantyRecords(lines, true)).created, 0)
    existing = []
    fail = true
    await assert.rejects(() => importWarrantyRecords(lines, true))
    assert.equal(statements.at(-1), 'rollback')
  } finally {
    db.$client.getConnection = original
  }
})
