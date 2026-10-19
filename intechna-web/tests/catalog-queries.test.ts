import { nextCacheFixture } from './next-cache-fixture'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getTableColumns } from 'drizzle-orm'
import { products } from '../app/lib/db/schema'
import { CATALOG_CACHE_TAG } from '../app/lib/catalog-cache'

type CapturedQuery = { sql: string; parameters: unknown[] }
const storedProduct = {
  id: 42,
  slug: 'custom-switch',
  name: 'Custom Switch',
  brand: 'Intech',
  category: 'Custom networking',
  category_slug: 'custom-networking',
  badges: null,
  summary: null,
  specs: null,
  applications: null,
  image_url: null,
  datasheet_url: null,
  status: 'published',
  created_at: '2026-10-14 00:00:00.000',
}

function productRow(changes: Record<string, unknown> = {}) {
  const values: Record<string, unknown> = { ...storedProduct, ...changes }
  return Object.values(getTableColumns(products)).map((column) => values[column.name])
}

test('catalog detail queries use published lookup, bounded related rows and slug-only build data', async () => {
  const cacheFixture = await nextCacheFixture([CATALOG_CACHE_TAG])
  const previousDatabaseUrl = process.env.DATABASE_URL
  // Creating a MySQL pool is local. Every query is intercepted before a connection opens.
  process.env.DATABASE_URL = 'mysql://fixture:fixture@example.invalid/fixture'
  let queries: typeof import('../app/lib/db/queries')
  let catalog: typeof import('../app/catalog-data')
  let db: (typeof import('../app/lib/db'))['db']
  try {
    queries = await import('../app/lib/db/queries')
    catalog = await import('../app/catalog-data')
    db = (await import('../app/lib/db')).db
  } finally {
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = previousDatabaseUrl
  }
  const originalQuery = db.$client.query
  const captured: CapturedQuery[] = []
  let rows: unknown[][] = []
  db.$client.query = (async (options: { sql: string }, parameters: unknown[]) => {
    const sql = options.sql
    captured.push({ sql, parameters })
    return [rows, []]
  }) as unknown as typeof originalQuery
  try {
    const maliciousSlug = "missing'; DELETE FROM products; --"
    assert.equal(await queries.getProductBySlug(maliciousSlug), null)
    const missing = captured.pop()!
    assert.ok(!missing.sql.includes(maliciousSlug))
    assert.match(missing.sql, /`products`\.`slug` = \?/)
    assert.match(missing.sql, /`products`\.`status` = \?/)
    assert.match(missing.sql, /limit \?$/)
    assert.deepEqual(missing.parameters, [maliciousSlug, 'published', 1])

    rows = [productRow()]
    const product = await catalog.getCatalogProductBySlug(storedProduct.slug)
    assert.ok(product)
    assert.equal(product.slug, storedProduct.slug)
    assert.equal(product.summary, '')
    assert.deepEqual(product.specs, [])
    assert.deepEqual(product.applications, [])
    assert.equal('id' in product, false)
    assert.equal('status' in product, false)
    const detail = captured.pop()!
    assert.deepEqual(detail.parameters, [storedProduct.slug, 'published', 1])

    rows = [productRow({ slug: 'related-switch' })]
    const related = await catalog.getRelatedCatalogProducts(
      storedProduct.slug,
      storedProduct.category_slug,
      storedProduct.brand,
    )
    assert.deepEqual(
      related.map(({ slug }) => slug),
      ['related-switch'],
    )
    const bounded = captured.pop()!
    assert.match(bounded.sql, /`products`\.`status` = \?/)
    assert.match(bounded.sql, /`products`\.`slug` <> \?/)
    assert.match(bounded.sql, /`products`\.`category_slug` = \?/)
    assert.match(bounded.sql, /`products`\.`brand` = \?/)
    assert.match(bounded.sql, /order by `products`\.`created_at`, `products`\.`id` limit \?$/)
    assert.deepEqual(bounded.parameters, [
      'published',
      storedProduct.slug,
      storedProduct.category_slug,
      storedProduct.brand,
      3,
    ])

    rows = [['custom-switch'], ['related-switch']]
    assert.deepEqual(await catalog.getCatalogProductSlugs(), [
      { slug: 'custom-switch' },
      { slug: 'related-switch' },
    ])
    const slugs = captured.pop()!
    assert.match(slugs.sql, /^select `slug` from `products`/)
    assert.deepEqual(slugs.parameters, ['published'])
    assert.equal(captured.length, 0)

    rows = []
    assert.equal(await catalog.getCatalogProductBySlug('missing'), null)
    const absent = captured.pop()!
    assert.deepEqual(absent.parameters, ['missing', 'published', 1])
  } finally {
    db.$client.query = originalQuery
    cacheFixture.restore()
  }
})

test('catalog caches public results across requests and immediately refreshes published, draft and deleted products', async () => {
  const cacheFixture = await nextCacheFixture([CATALOG_CACHE_TAG])
  const previousDatabaseUrl = process.env.DATABASE_URL
  process.env.DATABASE_URL = 'mysql://fixture:fixture@example.invalid/fixture'
  const catalog = await import('../app/catalog-data')
  const queries = await import('../app/lib/db/queries')
  const { db } = await import('../app/lib/db')
  if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL
  else process.env.DATABASE_URL = previousDatabaseUrl
  const originalQuery = db.$client.query
  let published = true
  let name = 'Original Switch'
  let queryCount = 0
  db.$client.query = (async (options: { sql: string }) => {
    const query = options.sql
    queryCount++
    return [
      !published
        ? []
        : query.startsWith('select `slug`')
          ? [[storedProduct.slug]]
          : [productRow({ name })],
      [],
    ]
  }) as unknown as typeof originalQuery
  try {
    assert.equal((await catalog.getCatalogProducts())[0].name, name)
    assert.equal((await catalog.getCatalogProductBySlug(storedProduct.slug))?.name, name)
    assert.deepEqual(await catalog.getCatalogProductSlugs(), [{ slug: storedProduct.slug }])
    assert.equal(queryCount, 3)
    name = 'Updated Switch'
    assert.equal((await catalog.getCatalogProducts())[0].name, 'Original Switch')
    assert.equal(
      (await catalog.getCatalogProductBySlug(storedProduct.slug))?.name,
      'Original Switch',
    )
    assert.deepEqual(await catalog.getCatalogProductSlugs(), [{ slug: storedProduct.slug }])
    assert.equal(queryCount, 3, 'warm public renders must not repeat MySQL queries')
    await queries.getProducts({ includeDrafts: true })
    assert.equal(queryCount, 4, 'administration must bypass the public cache')

    await cacheFixture.expire()
    assert.equal((await catalog.getCatalogProducts())[0].name, name)
    assert.equal((await catalog.getCatalogProductBySlug(storedProduct.slug))?.name, name)
    assert.deepEqual(await catalog.getCatalogProductSlugs(), [{ slug: storedProduct.slug }])

    published = false
    await cacheFixture.expire()
    assert.deepEqual(await catalog.getCatalogProducts(), [])
    assert.equal(await catalog.getCatalogProductBySlug(storedProduct.slug), null)
    assert.deepEqual(await catalog.getCatalogProductSlugs(), [])

    published = true
    await cacheFixture.expire()
    assert.equal((await catalog.getCatalogProductBySlug(storedProduct.slug))?.name, name)
    published = false
    await cacheFixture.expire()
    assert.equal(await catalog.getCatalogProductBySlug(storedProduct.slug), null)
  } finally {
    db.$client.query = originalQuery
    cacheFixture.restore()
  }
})
