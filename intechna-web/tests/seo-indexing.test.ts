import assert from 'node:assert/strict'
import { test } from 'node:test'
import robots from '../app/robots'
import { siteConfig } from '../app/data'
import { buildPublicSitemap } from '../app/lib/seo-indexing'
import { mergePublicSolutions } from '../app/lib/public-services-data'

const source = {
  products: [
    { slug: 'new-published-switch', brand: 'Cisco' },
    { slug: 'new-published-switch', brand: 'CISCO' },
    { slug: 'new-nas', brand: 'Thương hiệu Đ' },
  ],
  categories: [{ slug: 'switch' }, { slug: 'custom-public-category' }],
  posts: [{ slug: 'new-published-article' }],
}

test('sitemap follows public data instead of a stale seed catalog', () => {
  const urls = new Set(buildPublicSitemap(source).map(({ url }) => url))
  for (const path of [
    '/',
    '/san-pham/catalog',
    '/san-pham/catalog/new-published-switch',
    '/san-pham/custom-public-category',
    '/thuong-hieu/cisco',
    '/thuong-hieu/thuong-hieu-d',
    '/tin-tuc/new-published-article',
    '/dich-vu/thi-cong-mang-lan',
    '/giai-phap/mang-van-phong',
  ]) {
    assert.ok(urls.has(new URL(path, siteConfig.domain).toString()), path)
  }
  assert.ok(!Array.from(urls).some((url) => url.includes('cisco-cbs350-24t-4g')))
  assert.ok(
    !buildPublicSitemap({ ...source, products: [] }).some(({ url }) =>
      url.endsWith('/new-published-switch'),
    ),
  )
})

test('sitemap has unique canonical URLs and never invents modification dates', () => {
  const entries = buildPublicSitemap(source)
  assert.equal(new Set(entries.map(({ url }) => url)).size, entries.length)
  for (const entry of entries) {
    const url = new URL(entry.url)
    assert.equal(url.origin, siteConfig.domain)
    assert.equal(url.search, '')
    assert.equal(url.hash, '')
    assert.ok(!url.pathname.startsWith('/admin') && !url.pathname.startsWith('/api'))
    assert.ok(!('lastModified' in entry))
  }
  assert.deepEqual(buildPublicSitemap(source), entries)
})

test('sitemap includes newly published solutions and omits draft CMS entries', () => {
  const published = {
    slug: 'new-cms-solution',
    title: 'CMS solution',
    description: 'Solution description',
    keywords: 'LAN',
    deliverables: ['Network plan'],
    benefits: ['Maintainable'],
    status: 'published' as const,
  }
  const solutions = mergePublicSolutions([
    published,
    { ...published, slug: 'draft-cms-solution', status: 'draft' },
  ])
  const urls = buildPublicSitemap({ ...source, solutions }).map(({ url }) => new URL(url).pathname)
  assert.ok(urls.includes('/giai-phap/new-cms-solution'))
  assert.ok(urls.includes('/giai-phap/mang-van-phong'))
  assert.ok(!urls.includes('/giai-phap/draft-cms-solution'))
})

test('empty, dot and control-character segments cannot become sitemap URLs', () => {
  const invalid = ['', '.', '..', 'bad\u0000slug', 'bad\nslug']
  const entries = buildPublicSitemap({
    products: invalid.map((slug) => ({ slug, brand: '' })),
    categories: invalid.map((slug) => ({ slug })),
    posts: invalid.map((slug) => ({ slug })),
    services: [],
    solutions: [],
  })
  assert.equal(entries.length, 12)
})

test('legacy slugs remain a single encoded segment without becoming query or fragment URLs', () => {
  const slugs = ['../admin', 'model?draft=1', 'model#review', 'two words', 'sản-phẩm']
  const entries = buildPublicSitemap({
    products: slugs.map((slug) => ({ slug, brand: '' })),
    categories: [],
    posts: [],
    services: [],
    solutions: [],
  })
  for (const slug of slugs) {
    const expected = new URL(`/san-pham/catalog/${encodeURIComponent(slug)}`, siteConfig.domain)
    assert.ok(
      entries.some(({ url }) => url === expected.toString()),
      slug,
    )
    assert.equal(expected.search, '')
    assert.equal(expected.hash, '')
  }
})

function matchesRule(rule: string, path: string) {
  const exact = rule.endsWith('$')
  const prefix = exact ? rule.slice(0, -1) : rule
  return exact ? path === prefix : path.startsWith(prefix)
}

test('robots excludes private endpoints while allowing public pages and rendering assets', () => {
  const policy = robots()
  assert.equal(policy.sitemap, `${siteConfig.domain}/sitemap.xml`)
  assert.equal(policy.host, siteConfig.domain)
  const rule = Array.isArray(policy.rules) ? policy.rules[0] : policy.rules
  const blocked = [rule.disallow].flat().filter((value): value is string => !!value)
  for (const path of ['/admin', '/admin?next=/', '/admin/san-pham', '/api', '/api/contact']) {
    assert.ok(
      blocked.some((pattern) => matchesRule(pattern, path)),
      path,
    )
  }
  for (const path of [
    '/',
    '/san-pham/catalog/new-published-switch',
    '/_next/static/chunks/app.js',
    '/_next/image?url=%2Fimages%2Flogo.png',
    '/images/logo.png',
    '/favicon.ico',
    '/administrator-public-page',
  ]) {
    assert.ok(!blocked.some((pattern) => matchesRule(pattern, path)), path)
  }
})
