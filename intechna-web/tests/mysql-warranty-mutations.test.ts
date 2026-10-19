import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getTableColumns } from 'drizzle-orm'
import { warranty } from '../app/lib/db/schema'

test('MySQL warranty mutations bind fields, preserve the code and report missing or unchanged rows', async () => {
  const previous = process.env.DATABASE_URL
  process.env.DATABASE_URL = 'mysql://fixture:fixture@warranty-mutation.invalid/test'
  const { db } = await import('../app/lib/db')
  const { createWarranty, updateWarranty, deleteWarranty } = await import('../app/lib/db/queries')
  if (previous === undefined) delete process.env.DATABASE_URL
  else process.env.DATABASE_URL = previous
  const originalConnection = db.$client.getConnection
  const originalQuery = db.$client.query
  let exists = true
  let affectedRows = 1
  const transactions: string[] = []
  const input = {
    code: 'INTECH-2024-001',
    serial: 'SERIAL-2024-001',
    customer: "Owner'); DELETE FROM warranty; --",
    product: 'Switch',
    purchaseDate: '2024-02-29',
    warrantyUntil: '2025-02-28',
    status: 'Còn bảo hành',
    note: '',
  }
  const query = async (options: { sql: string }, parameters: unknown[]) => {
    const statement = options.sql
    if (['begin', 'commit', 'rollback'].includes(statement)) {
      transactions.push(statement)
      return [{ affectedRows: 0 }, []]
    }
    assert.ok(!statement.includes(input.customer))
    if (statement.startsWith('insert')) {
      assert.ok(parameters.includes(input.customer))
      assert.ok(parameters.includes(input.purchaseDate))
      return [{ affectedRows: 1, insertId: 1 }, []]
    }
    if (statement.startsWith('update')) {
      assert.ok(parameters.includes(input.customer))
      assert.equal(parameters.at(-1), input.code)
      const setClause = statement.slice(
        statement.indexOf(' set ') + 5,
        statement.indexOf(' where '),
      )
      assert.ok(!setClause.includes('`code`'))
      assert.ok(!setClause.includes('`id`'))
      return [{ affectedRows }, []]
    }
    if (statement.startsWith('delete')) {
      assert.deepEqual(parameters, [input.code])
      const deleted = exists
      exists = false
      return [{ affectedRows: deleted ? 1 : 0 }, []]
    }
    assert.equal(parameters[0], input.code)
    const row: Record<string, unknown> = {
      id: 1,
      ...input,
      purchase_date: input.purchaseDate,
      warranty_until: input.warrantyUntil,
    }
    return [
      exists ? [Object.values(getTableColumns(warranty)).map((column) => row[column.name])] : [],
      [],
    ]
  }
  db.$client.getConnection = (async () => ({
    release: () => {},
    query,
  })) as unknown as typeof originalConnection
  db.$client.query = query as unknown as typeof originalQuery
  try {
    assert.equal((await createWarranty(input))?.customer, input.customer)
    assert.deepEqual(transactions.splice(0), ['begin', 'commit'])
    assert.equal((await updateWarranty({ ...input, id: 99 }))?.code, input.code)
    assert.deepEqual(transactions.splice(0), ['begin', 'commit'])
    affectedRows = 0
    assert.equal((await updateWarranty(input))?.id, 1)
    assert.deepEqual(transactions.splice(0), ['begin', 'commit'])
    assert.equal(await deleteWarranty(input.code), true)
    assert.equal(await deleteWarranty(input.code), false)
    assert.equal(await updateWarranty(input), null)
  } finally {
    db.$client.getConnection = originalConnection
    db.$client.query = originalQuery
  }
})
