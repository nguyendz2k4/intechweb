import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getTableColumns } from 'drizzle-orm'
import { products } from '../app/lib/db/schema'

test('MySQL product mutations preserve duplicate errors, bound values, empty JSON arrays and unchanged updates', async () => {
  const previous = process.env.DATABASE_URL
  process.env.DATABASE_URL = 'mysql://fixture:fixture@mutation.invalid/test'
  const { db } = await import('../app/lib/db')
  const { createProduct, updateProduct } = await import('../app/lib/db/queries')
  if (previous === undefined) delete process.env.DATABASE_URL
  else process.env.DATABASE_URL = previous
  const original = db.$client.getConnection
  let failure: string | null = null
  let exists = true
  const transactionStatements: string[] = []
  const input = {
    slug: 'my-product',
    name: "Owner product'); DELETE FROM products; --",
    brand: 'Owner',
    category: 'Switch',
    categorySlug: 'switch',
    summary: '',
    badges: [],
    specs: [],
    applications: [],
    imageUrl: '',
    datasheetUrl: '',
    status: 'draft' as const,
  }
  db.$client.getConnection = (async () => ({
    release: () => {},
    query: async (options: { sql: string }, parameters: unknown[]) => {
      const statement = options.sql
      if (['begin', 'commit', 'rollback'].includes(statement)) {
        transactionStatements.push(statement)
        return [{ affectedRows: 0 }, []]
      }
      assert.ok(!statement.includes(input.name))
      if (statement.startsWith('insert')) {
        assert.ok(parameters.includes(input.name))
        assert.ok(parameters.includes('[]'))
        if (failure) throw Object.assign(new Error('Synthetic driver error'), { code: failure })
        return [{ affectedRows: 1, insertId: 1 }, []]
      }
      if (statement.startsWith('update')) return [{ affectedRows: exists ? 1 : 0 }, []]
      const row: Record<string, unknown> = {
        id: 1,
        ...input,
        category_slug: input.categorySlug,
        badges: '[]',
        specs: '[]',
        applications: '[]',
        image_url: '',
        datasheet_url: '',
        created_at: '2026-10-14 00:00:00.000',
      }
      return [
        exists ? [Object.values(getTableColumns(products)).map((column) => row[column.name])] : [],
        [],
      ]
    },
  })) as unknown as typeof original
  try {
    assert.equal((await createProduct(input))?.name, input.name)
    assert.deepEqual(transactionStatements.splice(0), ['begin', 'commit'])
    failure = 'ER_DUP_ENTRY'
    assert.equal(await createProduct(input), null)
    assert.deepEqual(transactionStatements.splice(0), ['begin', 'rollback'])
    failure = 'ER_DATA_TOO_LONG'
    await assert.rejects(createProduct(input))
    assert.deepEqual(transactionStatements.splice(0), ['begin', 'rollback'])
    failure = null
    assert.equal((await updateProduct(input))?.slug, input.slug)
    exists = false
    assert.equal(await updateProduct(input), null)
  } finally {
    db.$client.getConnection = original
  }
})
