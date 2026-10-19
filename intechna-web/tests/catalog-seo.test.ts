import assert from 'node:assert/strict'
import { test } from 'node:test'
import {
  catalogCardProducts,
  catalogCategoryPath,
  catalogHasFilters,
  catalogPagePath,
  catalogProductPath,
  catalogView,
  getCatalogCategories,
  productImageSource,
  productKeySpecs,
  filterCatalog,
} from '../app/catalog-utils'
import { productSchema, catalogMetadata } from '../app/lib/catalog-seo'
import { absoluteUrl } from '../app/lib/seo'
import { productList } from './catalog-fixture'

test('smaller catalog card data preserves real model cards and every search field without mutating the source', () => {
  const original = JSON.stringify(productList)
  const compact = catalogCardProducts(productList)
  assert.equal(JSON.stringify(productList), original)
  assert.equal(compact.length, productList.length)
  productList.forEach((product, index) => {
    const card = compact[index]
    assert.notEqual(card, product)
    assert.notEqual(card.specs, product.specs)
    assert.notEqual(card.badges, product.badges)
    assert.deepEqual(productKeySpecs(card), productKeySpecs(product))
    assert.deepEqual(card.badges, product.badges.slice(0, 3))
    assert.equal(card.summary, product.summary)
    assert.equal(card.imageUrl, product.imageUrl)
    assert.equal(card.datasheetUrl, product.datasheetUrl)
  })
  const queries = [
    new URLSearchParams(),
    new URLSearchParams({ q: productList[0].name }),
    new URLSearchParams({ q: 'quản trị' }),
    new URLSearchParams({ q: 'NAS' }),
    new URLSearchParams({ brand: 'cisco', category: 'switch' }),
    new URLSearchParams({ category: 'wifi-access-point' }),
    new URLSearchParams({ q: 'nonexistent-model-xyz' }),
  ]
  for (const search of queries) {
    assert.deepEqual(
      filterCatalog(compact, search).map((product) => product.slug),
      filterCatalog(productList, search).map((product) => product.slug),
    )
  }
  assert.ok(Buffer.byteLength(JSON.stringify(compact)) < Buffer.byteLength(original))
})

const models = Array.from({ length: 50 }, (_, index) => ({
  ...productList[0],
  slug: `model-${index + 1}`,
  name: `Model ${index + 1}`,
}))

test('pagination schema uses the same 24 products as the catalog UI', () => {
  const view = catalogView(models, new URLSearchParams('page=2'))
  assert.equal(view.page, 2)
  assert.equal(view.totalPages, 3)
  assert.equal(view.validPage, true)
  assert.equal(view.visible.length, 24)
  assert.equal(view.visible[0].slug, 'model-25')
  assert.equal(catalogPagePath('/san-pham/catalog', view.page), '/san-pham/catalog?page=2')
  for (const page of ['0', '-1', '1.5', 'abc', '', '4', '9007199254740992']) {
    assert.equal(catalogView(models, new URLSearchParams({ page })).validPage, false)
  }
})

test('database categories have usable routes and malformed category slugs fall back to filters', () => {
  const custom = { ...models[0], categorySlug: 'camera-ip', category: 'Camera IP' }
  const malformed = { ...models[0], categorySlug: 'network/access', category: 'Network' }
  const categories = getCatalogCategories([custom, custom, malformed])
  assert.equal(categories.filter((category) => category.slug === 'camera-ip').length, 1)
  assert.deepEqual(categories.find((category) => category.slug === 'camera-ip')?.useCases, [])
  assert.equal(catalogCategoryPath(custom.categorySlug, [custom]), '/san-pham/camera-ip')
  assert.equal(
    catalogCategoryPath(malformed.categorySlug, [malformed]),
    '/san-pham/catalog?category=network%2Faccess',
  )
  const reserved = { ...models[0], categorySlug: 'catalog' }
  assert.equal(
    catalogCategoryPath(reserved.categorySlug, [reserved]),
    '/san-pham/catalog?category=catalog',
  )
  assert.equal(catalogProductPath('name/with?query'), '/san-pham/catalog/name%2Fwith%3Fquery')
})

test('filtered catalog URLs are noindex while unfiltered pagination stays self-canonical', () => {
  assert.equal(catalogHasFilters({ q: 'Switch' }), true)
  assert.equal(catalogHasFilters({ page: '2', utm_source: 'newsletter' }), false)
  const filtered = catalogMetadata({
    title: 'Catalog',
    description: 'Thiết bị mạng',
    path: '/san-pham/catalog',
    search: { brand: 'cisco', page: '2' },
    page: 2,
  })
  assert.deepEqual(filtered.robots, { index: false, follow: true })
  assert.equal(filtered.alternates?.canonical, absoluteUrl('/san-pham/catalog'))
  const paginated = catalogMetadata({
    title: 'Catalog',
    description: 'Thiết bị mạng',
    path: '/san-pham/catalog',
    search: { page: '2' },
    page: 2,
  })
  assert.equal(paginated.alternates?.canonical, absoluteUrl('/san-pham/catalog?page=2'))
  assert.notEqual((paginated.robots as { index?: boolean })?.index, false)
})

test('product structured data never invents price, stock, ratings or a placeholder photo', () => {
  const schema = productSchema(models[0])
  assert.equal(schema.mainEntity.name, models[0].name)
  assert.equal(schema.mainEntity.brand.name, models[0].brand)
  assert.equal(schema.url, absoluteUrl(catalogProductPath(models[0].slug)))
  assert.equal(schema.mainEntity.url, schema.url)
  for (const key of ['offers', 'review', 'aggregateRating', 'sku', 'image']) {
    assert.equal(key in schema.mainEntity, false)
  }
  const image = productSchema({ ...models[0], imageUrl: '/images/actual-product.webp' })
  assert.equal(image.mainEntity.image?.[0], absoluteUrl('/images/actual-product.webp'))
  const unsafe = productSchema({ ...models[0], imageUrl: 'javascript:alert(1)' })
  assert.equal('image' in unsafe.mainEntity, false)
})

test('body and structured image URLs share the same origin and reject malformed CMS sources', () => {
  assert.equal(productImageSource('images/product.webp'), '/images/product.webp')
  assert.equal(productImageSource(' /uploads/product.webp '), '/uploads/product.webp')
  assert.equal(productImageSource(absoluteUrl('/uploads/product.webp')), '/uploads/product.webp')
  for (const source of [
    '',
    'http://',
    'javascript:alert(1)',
    'data:image/svg+xml,invalid',
    'https://user:pass@example.com/image.webp',
  ]) {
    assert.equal(productImageSource(source), null)
    assert.equal('image' in productSchema({ ...models[0], imageUrl: source }).mainEntity, false)
  }
})
