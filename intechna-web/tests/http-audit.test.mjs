import assert from 'node:assert/strict'
import { test } from 'node:test'
import { auditPageHtml, extractSitemapUrls } from '../scripts/audit-public-seo.mjs'

const origin = 'https://intechna.vn'
const shared = [{ '@type': 'WebSite' }, { '@type': 'ProfessionalService' }]
function html({
  path = '/',
  canonical = path,
  robots = 'index, follow',
  schema,
  body = '<h1>Intech</h1>',
  extra = '',
} = {}) {
  return `<html><head><title>Hạ tầng mạng | Intech</title>
    <meta name="description" content="Tư vấn hạ tầng mạng doanh nghiệp">
    <meta name="robots" content="${robots}">
    <link rel="canonical" href="${origin}${canonical}">
    <meta property="og:url" content="${origin}${canonical}">
    <script type="application/ld+json">${JSON.stringify(
      [...shared, schema ?? { '@type': 'WebPage', name: 'Intech', url: `${origin}${path}` }]
        .flat()
        .map((entity) => ({ '@context': 'https://schema.org', ...entity })),
    )}</script>${extra}</head><body>${body}</body></html>`
}

test('HTTP audit parses XML locations and ignores image sitemap locations', () => {
  const xml = `<urlset><url><loc>${origin}/</loc><image:image><image:loc>${origin}/image.webp</image:loc></image:image></url>
    <url><loc>${origin}/san-pham/catalog/model</loc></url></urlset>`
  assert.deepEqual(extractSitemapUrls(xml), [`${origin}/`, `${origin}/san-pham/catalog/model`])
  assert.throws(() => extractSitemapUrls('<html>Missing sitemap</html>'), /urlset/)
})

test('SSR link audit ignores Next/script payload strings and accepts valid metadata', () => {
  const source = html({
    body: '<h1>Intech</h1><a href="/san-pham/catalog?page=2&amp;category=switch">Catalog</a>',
    extra: '<script>self.__next_f.push([1,"<a href=\"/fake-next-payload\">Fake</a>"])</script>',
  })
  const result = auditPageHtml(source, { url: `${origin}/` })
  assert.deepEqual(result.failures, [])
  assert.deepEqual(result.internalLinks, ['/san-pham/catalog?page=2&category=switch'])
})

test('audit surfaces malformed JSON-LD and duplicate H1 headings', () => {
  const source = html({
    body: '<h1>First</h1><h1>Second</h1>',
    extra: '<script type="application/ld+json">{"bad":</script>',
  })
  const result = auditPageHtml(source, { url: `${origin}/` })
  assert.ok(result.failures.some(({ code }) => code === 'h1'))
  assert.ok(result.failures.some(({ code }) => code === 'json-ld-syntax'))
})

test('homepage metadata compares equivalent origin URLs with or without the root slash', () => {
  const source = html().replaceAll(`${origin}/`, origin)
  assert.deepEqual(auditPageHtml(source, { url: `${origin}/` }).failures, [])
})

test('quote and project pages use their appropriate WebPage subtypes', () => {
  for (const [path, type] of [
    ['/bao-gia', 'ContactPage'],
    ['/du-an', 'CollectionPage'],
  ]) {
    const source = html({
      path,
      schema: [
        { '@type': type, name: 'Intech', url: `${origin}${path}` },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { position: 1, name: 'Trang chủ', item: `${origin}/` },
            { position: 2, name: 'Intech', item: `${origin}${path}` },
          ],
        },
      ],
      body: '<h1>Intech</h1><nav class="breadcrumbs"><a href="/">Trang chủ</a><span>Intech</span></nav>',
    })
    assert.deepEqual(auditPageHtml(source, { url: `${origin}${path}` }).failures, [])
  }
})

test('filtered collections canonicalize to the base and require noindex', () => {
  const path = '/san-pham/catalog?brand=cisco'
  const breadcrumb = {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Trang chủ', item: `${origin}/` },
      { '@type': 'ListItem', position: 2, name: 'Catalog', item: `${origin}/san-pham/catalog` },
    ],
  }
  const source = html({
    path,
    canonical: '/san-pham/catalog',
    robots: 'noindex, follow',
    schema: [
      {
        '@type': 'CollectionPage',
        name: 'Catalog',
        url: `${origin}${path}`,
        mainEntity: { '@type': 'ItemList', numberOfItems: 0, itemListElement: [] },
      },
      breadcrumb,
    ],
    body: '<h1>Catalog</h1><nav class="breadcrumbs"><a href="/">Trang chủ</a><span>Catalog</span></nav>',
  })
  assert.deepEqual(auditPageHtml(source, { url: `${origin}${path}` }).failures, [])
  const indexable = source.replace('noindex, follow', 'index, follow')
  assert.ok(
    auditPageHtml(indexable, { url: `${origin}${path}` }).failures.some(
      ({ code }) => code === 'robots-meta',
    ),
  )
})

test('404 probes require HTTP404 and noindex without normal-page schema requirements', () => {
  assert.deepEqual(
    auditPageHtml('<meta name="robots" content="noindex">', {
      url: `${origin}/missing`,
      status: 404,
      expectedStatus: 404,
    }).failures,
    [],
  )
  const result = auditPageHtml('<meta name="robots" content="index">', {
    url: `${origin}/missing`,
    status: 200,
    expectedStatus: 404,
  })
  assert.ok(result.failures.some(({ code }) => code === 'http-status'))
  const indexable404 = auditPageHtml('<h1>Missing</h1>', {
    url: `${origin}/missing`,
    status: 404,
    expectedStatus: 404,
  })
  assert.ok(indexable404.failures.some(({ code }) => code === '404-noindex'))
})
