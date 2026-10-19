import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { importContent, validateContentEnvelope } from '../scripts/content-transfer'
import type { getMysqlDatabase } from '../app/lib/db/mysql-client.mjs'

const example = JSON.parse(
  await readFile(new URL('../data/content.example.json', import.meta.url), 'utf8'),
)
const copy = () => {
  const value = structuredClone(example)
  value.products = [
    {
      slug: 'test-product',
      name: 'Test Product',
      brand: 'Test',
      category: 'Switch',
      categorySlug: 'switch',
      summary: '',
      badges: [],
      specs: [],
      applications: [],
      imageUrl: '',
      datasheetUrl: '',
      status: 'draft',
    },
  ]
  value.counts.products = 1
  return value
}

test('portable content preserves stable slugs, draft status, and publication date', () => {
  const input = copy()
  input.posts[0].publishedAt = '2026-10-13T08:09:10Z'
  const result = validateContentEnvelope(input)
  assert.equal(result.posts[0].publishedAt, '2026-10-13T08:09:10.000Z')
  assert.equal(result.posts[0].status, 'draft')
  assert.equal(result.products[0].slug, 'test-product')
  assert.deepEqual(result.counts, { products: 1, posts: 1, services: 1 })
})

test('private data, unknown layout controls, and internal IDs are refused', () => {
  for (const key of ['contacts', 'warranty', 'accounts', 'DATABASE_URL']) {
    assert.throws(() => validateContentEnvelope({ ...copy(), [key]: [] }), /không được phép/)
  }
  for (const key of ['layout', 'textPosition', 'id']) {
    const input = copy()
    input.products[0][key] = 'test'
    assert.throws(() => validateContentEnvelope(input), /không được phép/)
  }
})

test('content refuses duplicate slugs, malformed URLs, dates, statuses, and metadata', () => {
  const duplicate = copy()
  duplicate.products.push(duplicate.products[0])
  duplicate.counts.products = 2
  assert.throws(() => validateContentEnvelope(duplicate), /bị trùng/)
  const url = copy()
  url.products[0].imageUrl = 'javascript:alert(1)'
  assert.throws(() => validateContentEnvelope(url))
  const date = copy()
  date.posts[0].publishedAt = '2026-02-30T00:00:00Z'
  assert.throws(() => validateContentEnvelope(date), /Thời gian/)
  const status = copy()
  status.products[0].status = 'secret'
  assert.throws(() => validateContentEnvelope(status), /Trạng thái/)
  const counts = copy()
  counts.counts.products = 5
  assert.throws(() => validateContentEnvelope(counts), /không khớp/)
  assert.throws(() => validateContentEnvelope({ ...copy(), version: 2 }), /Phiên bản/)
})

test('incomplete import records cannot silently blank content or unpublish it', () => {
  for (const [group, field] of [
    ['products', 'status'],
    ['products', 'summary'],
    ['posts', 'body'],
    ['services', 'keywords'],
  ] as const) {
    const input = copy()
    delete input[group][0][field]
    assert.throws(() => validateContentEnvelope(input), /đủ các trường/)
  }
})

test('an invalid later record stops import before a single database query', async () => {
  const input = copy()
  input.services[0].slug = '../private'
  let queried = false
  const unavailableDatabase = (() => {
    queried = true
    throw new Error('Database should not be touched')
  }) as unknown as ReturnType<typeof getMysqlDatabase>
  await assert.rejects(importContent(unavailableDatabase, input))
  assert.equal(queried, false)
})

test('valid content imports atomically and hostile text stays in query parameters', async () => {
  const input = copy()
  const hostileText = "Example'); DELETE FROM posts; --"
  input.products[0].name = hostileText
  const statements: string[] = []
  const parameters: unknown[][] = []
  let transactions = 0
  const mock = {
    transaction: async (work: (tx: unknown) => Promise<unknown>) => {
      transactions += 1
      return work({
        execute: async (statement: string, values: unknown[]) => {
          statements.push(statement)
          parameters.push(values)
          return { affectedRows: 1 }
        },
      })
    },
  } as unknown as ReturnType<typeof getMysqlDatabase>
  assert.deepEqual(await importContent(mock, input), { products: 1, posts: 1, services: 1 })
  assert.equal(transactions, 1)
  assert.ok(statements.every((statement) => !statement.includes(hostileText)))
  assert.ok(parameters.some((values) => values.includes(hostileText)))
})
