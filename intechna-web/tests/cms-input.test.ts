import assert from 'node:assert/strict'
import { test } from 'node:test'
import { contentSlug, postInput, productInput } from '../app/lib/cms-input'
import { mergePublicPosts } from '../app/lib/public-posts-data'
import { posts } from '../app/data'
import { PRODUCT_CATEGORY_OPTIONS } from '../app/lib/product-categories'
import { filterCatalog } from '../app/catalog-utils'

const product = {
  name: 'Thiết bị điện',
  brand: 'Intech',
  category: 'Switch',
  categorySlug: 'switch',
}

test('CMS accepts only the fixed public product model, preserves technical lists, and defaults new items to draft', () => {
  const result = productInput({
    ...product,
    specs: ['24 cổng'],
    applications: ['Văn phòng'],
    badges: ['PoE'],
  })
  assert.equal(result.slug, 'intech-thiet-bi-dien')
  assert.equal(result.status, 'draft')
  assert.deepEqual(result.specs, ['24 cổng'])
  for (const key of ['sections', 'layout', 'promotion', 'focusKeyword', 'role', 'id']) {
    assert.throws(() => productInput({ ...product, [key]: 'untrusted' }))
  }
})

test('malformed types, unsafe media URLs, invalid slugs and status values are rejected', () => {
  for (const change of [
    { name: {} },
    { badges: 'PoE' },
    { specs: [3] },
    { imageUrl: 'javascript:alert(1)' },
    { imageUrl: '//evil.example/x.png' },
    { status: 'featured' },
    { status: null },
    { slug: 0 },
    { slug: '../admin' },
  ]) {
    assert.throws(() => productInput({ ...product, ...change }))
  }
  assert.throws(() => productInput(product, true))
  assert.equal(productInput({ ...product, slug: 'stable-url' }, true).slug, 'stable-url')
  assert.equal(contentSlug('Đèn điện ở Nghệ An'), 'den-dien-o-nghe-an')
})

test('product brand is saved in uppercase for creates and updates without changing slug behavior', () => {
  const created = productInput({ ...product, brand: '  cisco  ' })
  assert.equal(created.brand, 'CISCO')
  assert.equal(created.slug, 'cisco-thiet-bi-dien')

  const updated = productInput(
    { ...product, slug: 'keep-this-url', brand: 'MikroTik', name: 'router hAP ax3' },
    true,
  )
  assert.equal(updated.brand, 'MIKROTIK')
  assert.equal(updated.name, 'router hAP ax3')
  assert.equal(updated.slug, 'keep-this-url')

  const unicode = productInput({ ...product, brand: 'straße' })
  assert.equal(unicode.brand, 'STRASSE')
  assert.equal(unicode.slug, contentSlug('straße-Thiết bị điện'))
  assert.throws(() => productInput({ ...product, brand: 'ß'.repeat(100) }))
})

test('each admin category saves to its public category even when an old label says Switch', () => {
  assert.deepEqual(
    PRODUCT_CATEGORY_OPTIONS.map((category) => category.slug),
    ['switch', 'wifi-access-point', 'router', 'firewall', 'module-quang-phu-kien', 'nas-luu-tru'],
  )
  for (const category of PRODUCT_CATEGORY_OPTIONS) {
    const saved = productInput({ ...product, categorySlug: category.slug })
    assert.equal(saved.category, category.label)
    assert.equal(saved.categorySlug, category.slug)
    const publishedProduct = {
      ...saved,
      imageUrl: saved.imageUrl ?? undefined,
      datasheetUrl: saved.datasheetUrl ?? undefined,
    }
    assert.equal(
      filterCatalog([publishedProduct], new URLSearchParams(), undefined, category.slug).length,
      1,
    )
    if (category.slug !== 'switch')
      assert.equal(
        filterCatalog([publishedProduct], new URLSearchParams('category=switch')).length,
        0,
      )
  }
})

test('new products require one of six categories while legacy content remains editable and exportable', () => {
  assert.throws(() => productInput({ ...product, categorySlug: '' }))
  assert.throws(() =>
    productInput({ ...product, categorySlug: 'camera-ip', category: 'Camera IP' }),
  )
  const legacy = productInput(
    { ...product, slug: 'legacy-camera', categorySlug: 'camera-ip', category: 'Camera IP' },
    true,
  )
  assert.equal(legacy.categorySlug, 'camera-ip')
  assert.equal(legacy.category, 'Camera IP')
})

test('draft article overrides cannot leak via static article fallback or article detail merge', () => {
  const row = {
    ...posts[0],
    body: 'Private draft',
    publishedAt: new Date('2026-01-01'),
    status: 'draft' as const,
  }
  assert.ok(!mergePublicPosts([row]).some((post) => post.slug === row.slug))
  assert.ok(
    mergePublicPosts([{ ...row, status: 'published' }]).some((post) => post.body === row.body),
  )
  assert.equal(
    postInput({ title: 'Bài mới', description: 'Mô tả', body: '# Tiêu đề' }).status,
    'draft',
  )
})
