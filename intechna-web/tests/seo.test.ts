import assert from 'node:assert/strict'
import { test } from 'node:test'
import { siteConfig } from '../app/data'
import { defaultSiteUrl, resolveSiteUrl } from '../app/lib/site-url'
import {
  absoluteUrl,
  breadcrumbSchema,
  collectionSchema,
  pageMetadata,
  serializeJsonLd,
  publicImageUrl,
} from '../app/lib/seo'

test('untrusted JSON-LD content cannot terminate its script or change round-trip values', () => {
  const data = { name: '</script><script>alert("x")</script>&\u2028\u2029' }
  const serialized = serializeJsonLd(data)
  assert.ok(!serialized.includes('<') && !serialized.includes('&'))
  assert.deepEqual(JSON.parse(serialized), data)
})

test('missing, unsafe and malformed social images use the branded fallback', () => {
  const fallback = `${siteConfig.domain}/images/hardware/infrastructure.webp`
  for (const image of [
    '',
    undefined,
    'http://',
    'javascript:alert(1)',
    'data:image/png;base64,abc',
  ]) {
    assert.equal(publicImageUrl(image), fallback)
  }
  assert.equal(
    publicImageUrl('/uploads/images/product.webp'),
    `${siteConfig.domain}/uploads/images/product.webp`,
  )
})

test('product breadcrumb preserves all linked ancestors and ordered positions', () => {
  const paths = ['/', '/san-pham', '/san-pham/switch', '/san-pham/catalog/cisco-cbs350']
  const schema = breadcrumbSchema(paths.map((path, index) => ({ name: `Level ${index}`, path })))
  assert.deepEqual(
    schema.itemListElement.map((item) => item.position),
    [1, 2, 3, 4],
  )
  assert.deepEqual(
    schema.itemListElement.map((item) => item.item),
    paths.map(absoluteUrl),
  )
})

test('page canonical and social tags identify the current page, including pagination', () => {
  const metadata = pageMetadata({
    title: 'Switch',
    description: 'Thiết bị mạng',
    path: '/san-pham/switch?page=2',
  })
  assert.equal(metadata.alternates?.canonical, `${siteConfig.domain}/san-pham/switch?page=2`)
  assert.equal(metadata.openGraph?.url, metadata.alternates?.canonical)
  assert.equal(metadata.openGraph?.title, 'Switch | Intech')
})

test('collection schema lists only supplied visible items and does not invent ratings or prices', () => {
  const schema = collectionSchema({
    name: 'Switch',
    description: 'Thiết bị mạng',
    path: '/san-pham/switch',
    items: [{ name: 'Cisco', path: '/san-pham/catalog/cisco' }],
  })
  assert.equal(schema.mainEntity.numberOfItems, 1)
  assert.equal(
    schema.mainEntity.itemListElement[0].url,
    `${siteConfig.domain}/san-pham/catalog/cisco`,
  )
  assert.ok(!JSON.stringify(schema).includes('aggregateRating'))
  assert.ok(!JSON.stringify(schema).includes('offers'))
})

test('canonical deployment domain has one safe override for future migrations', () => {
  assert.equal(resolveSiteUrl(undefined), defaultSiteUrl)
  assert.equal(defaultSiteUrl, 'https://intechna.vn')
  assert.equal(resolveSiteUrl(' https://new-example.vn/ '), 'https://new-example.vn')
  for (const value of [
    'https://example.vn/blog',
    'https://example.vn/?q=1',
    'https://example.vn/#hash',
    'http://example.vn',
    'https://user:pass@example.vn',
    'javascript:alert(1)',
  ]) {
    assert.throws(() => resolveSiteUrl(value))
  }
})
