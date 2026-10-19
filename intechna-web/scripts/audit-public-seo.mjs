import { createRequire } from 'node:module'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const { parse } = require('next/dist/compiled/node-html-parser')
const sharp = require('sharp')

const text = (node) => node?.text?.replace(/\s+/g, ' ').trim() ?? ''
const nonempty = (value) => typeof value === 'string' && Boolean(value.trim())
const typesOf = (node) => [node?.['@type']].flat().filter(Boolean)
const hasType = (node, type) => typesOf(node).includes(type)
const absoluteHttp = (value) => {
  try {
    return /^https?:$/.test(new URL(value).protocol)
  } catch {
    return false
  }
}

function schemaObjects(value, result = []) {
  if (Array.isArray(value)) value.forEach((item) => schemaObjects(item, result))
  else if (value && typeof value === 'object') {
    if (value['@type']) result.push(value)
    Object.values(value).forEach((item) => schemaObjects(item, result))
  }
  return result
}

export function extractSitemapUrls(xml) {
  const document = parse(xml)
  if (!document.querySelector('urlset')) throw new Error('Expected a sitemap urlset XML document')
  return document.querySelectorAll('url > loc').map((node) => text(node))
}

function normalizedUrl(value, origin) {
  try {
    return new URL(value, origin).toString()
  } catch {
    return null
  }
}

function documentLink(url, origin) {
  return (
    url.origin === origin &&
    !/^\/(?:admin|api|_next)(?:\/|$)/.test(url.pathname) &&
    !/\.(?:avif|webp|png|jpe?g|gif|svg|ico|pdf|zip|css|js|woff2?|ttf|xml|txt)$/i.test(url.pathname)
  )
}

function expectedMetadata(url) {
  const expected = new URL(url)
  const filtered = ['q', 'brand', 'category'].some((key) =>
    Boolean(expected.searchParams.get(key)?.trim()),
  )
  const warrantyQuery = expected.pathname === '/bao-hanh' && expected.searchParams.has('q')
  const page = Number(expected.searchParams.get('page'))
  expected.search = ''
  expected.hash = ''
  if (!filtered && !warrantyQuery && Number.isSafeInteger(page) && page > 1)
    expected.searchParams.set('page', String(page))
  return { canonical: expected.toString(), noindex: filtered || warrantyQuery }
}

function expectedSchemaType(path) {
  if (/^\/san-pham\/catalog\/[^/]+$/.test(path)) return 'Product'
  if (/^\/tin-tuc\/[^/]+$/.test(path)) return 'BlogPosting'
  if (/^\/(?:dich-vu|giai-phap)\/[^/]+$/.test(path)) return 'Service'
  if (/^\/(?:san-pham(?:\/[^/]+)?|thuong-hieu(?:\/[^/]+)?|tin-tuc|dich-vu|giai-phap)$/.test(path))
    return 'CollectionPage'
  if (path === '/gioi-thieu') return 'AboutPage'
  if (path === '/lien-he' || path === '/bao-gia') return 'ContactPage'
  if (path === '/du-an') return 'CollectionPage'
  return 'WebPage'
}

/** Checks the returned server HTML; this is not Google's Rich Results Test. */
export function auditPageHtml(html, { url, status = 200, expectedStatus = 200 }) {
  const document = parse(html)
  const pageUrl = new URL(url)
  const failures = []
  const warnings = []
  const fail = (code, message) => failures.push({ code, message })
  const warn = (code, message) => warnings.push({ code, message })
  const canonicalNodes = document.querySelectorAll('link[rel="canonical"]')
  const canonical = canonicalNodes[0]?.getAttribute('href') ?? null
  const title = text(document.querySelector('title'))
  const description =
    document.querySelector('meta[name="description"]')?.getAttribute('content') ?? ''
  const ogUrl = document.querySelector('meta[property="og:url"]')?.getAttribute('content') ?? null
  const robots = document
    .querySelectorAll('meta[name="robots"]')
    .map((node) => node.getAttribute('content') ?? '')
    .join(',')
  const h1 = document.querySelectorAll('h1')
  const internalLinks = new Set()
  const anchors = document.querySelectorAll('a[href]')
  for (const anchor of anchors) {
    const href = anchor.getAttribute('href')
    if (!href || /^(?:tel:|mailto:|javascript:|data:)/i.test(href)) continue
    const target = normalizedUrl(href, pageUrl)
    if (!target) {
      fail('malformed-link', `Invalid anchor URL: ${href}`)
      continue
    }
    const candidate = new URL(target)
    if (!documentLink(candidate, pageUrl.origin)) continue
    if (
      candidate.pathname === pageUrl.pathname &&
      candidate.search === pageUrl.search &&
      candidate.hash
    ) {
      let id
      try {
        id = decodeURIComponent(candidate.hash.slice(1))
      } catch {
        fail('malformed-fragment', `Invalid fragment encoding: ${candidate.hash}`)
        continue
      }
      if (!document.querySelectorAll('[id]').some((node) => node.getAttribute('id') === id))
        fail('missing-fragment', `Anchor target #${id} does not exist in this page`)
    }
    candidate.hash = ''
    internalLinks.add(`${candidate.pathname}${candidate.search}`)
  }

  const result = {
    path: `${pageUrl.pathname}${pageUrl.search}`,
    status,
    expectedStatus,
    canonical,
    ogUrl,
    title,
    description,
    robots,
    h1Count: h1.length,
    h1: h1.map(text),
    jsonLdTypes: [],
    internalLinks: Array.from(internalLinks).sort(),
    failures,
    warnings,
  }
  if (status !== expectedStatus)
    fail('http-status', `Expected HTTP ${expectedStatus}; received ${status}`)
  if (expectedStatus === 404) {
    if (status === 404 && !/\bnoindex\b/i.test(robots))
      fail('404-noindex', 'The missing page should carry noindex')
    return result
  }
  if (status !== 200) return result
  const metadata = expectedMetadata(pageUrl)
  if (h1.length !== 1 || !text(h1[0])) fail('h1', `Expected one nonempty H1; received ${h1.length}`)
  if (!title) fail('title', 'The document title is empty')
  if (/(?:\|\s*Intech\s*){2,}/iu.test(title))
    fail('duplicated-title-suffix', 'Title repeats the Intech suffix')
  if (!description.trim()) fail('description', 'The meta description is empty')
  if (
    canonicalNodes.length !== 1 ||
    !absoluteHttp(canonical) ||
    normalizedUrl(canonical, pageUrl) !== metadata.canonical
  )
    fail(
      'canonical',
      `Expected one canonical ${metadata.canonical}; received ${canonicalNodes.length}: ${canonical}`,
    )
  if (!absoluteHttp(ogUrl) || normalizedUrl(ogUrl, pageUrl) !== metadata.canonical)
    fail('og-url', `Expected og:url ${metadata.canonical}; received ${ogUrl}`)
  if (metadata.noindex !== /\bnoindex\b/i.test(robots))
    fail(
      'robots-meta',
      `Expected ${metadata.noindex ? 'noindex' : 'indexable'} page; received ${robots}`,
    )

  const roots = []
  for (const script of document.querySelectorAll('script[type="application/ld+json"]')) {
    try {
      roots.push(JSON.parse(script.rawText))
    } catch (error) {
      fail('json-ld-syntax', error.message)
    }
  }
  if (!roots.length) fail('json-ld-missing', 'No structured data found')
  const schemaRoots = roots.flat()
  if (schemaRoots.some((root) => root?.['@context'] !== 'https://schema.org'))
    fail('json-ld-context', 'Each JSON-LD root must use the https://schema.org context')
  const objects = roots.flatMap((root) => schemaObjects(root))
  const assetUrls = new Set()
  const addAsset = (value) => {
    if (!nonempty(value)) return
    const asset = normalizedUrl(value, pageUrl)
    if (asset && new URL(asset).origin === pageUrl.origin) assetUrls.add(asset)
  }
  for (const link of document.querySelectorAll('link[href]')) {
    if (/icon/i.test(link.getAttribute('rel') ?? '')) addAsset(link.getAttribute('href'))
  }
  for (const node of document.querySelectorAll('meta[property="og:image"]'))
    addAsset(node.getAttribute('content'))
  for (const node of document.querySelectorAll('img[src]')) addAsset(node.getAttribute('src'))
  for (const node of objects) {
    addAsset(node.logo)
    for (const image of [node.image].flat()) addAsset(image)
  }
  result.assetUrls = Array.from(assetUrls).sort()
  result.jsonLdTypes = Array.from(new Set(objects.flatMap(typesOf))).sort()
  const requiredType = expectedSchemaType(pageUrl.pathname)
  const entity = objects.find((node) => hasType(node, requiredType))
  if (!entity) fail('schema-page-type', `Missing ${requiredType} schema for this page type`)
  if (!objects.some((node) => hasType(node, 'WebSite')))
    fail('schema-website', 'Missing shared WebSite entity')
  if (!objects.some((node) => hasType(node, 'ProfessionalService')))
    fail('schema-organization', 'Missing shared ProfessionalService entity')
  if (entity) {
    if (!nonempty(entity.name ?? entity.headline))
      fail('schema-name', `${requiredType} has no name/headline`)
    if (!absoluteHttp(entity.url)) fail('schema-url', `${requiredType} URL is not absolute HTTP(S)`)
    if (!metadata.noindex && normalizedUrl(entity.url, pageUrl) !== metadata.canonical)
      fail('schema-canonical', `${requiredType} URL differs from the canonical URL`)
  }

  const breadcrumbs = objects.filter((node) => hasType(node, 'BreadcrumbList'))
  if (pageUrl.pathname !== '/' && !breadcrumbs.length)
    fail('breadcrumb-missing', 'Missing BreadcrumbList')
  const breadcrumbNav = document.querySelector('nav.breadcrumbs')
  const visibleAncestorLinks = new Set(
    (breadcrumbNav?.querySelectorAll('a[href]') ?? []).map((anchor) =>
      normalizedUrl(anchor.getAttribute('href'), pageUrl),
    ),
  )
  for (const breadcrumb of breadcrumbs) {
    const items = breadcrumb.itemListElement
    if (!Array.isArray(items) || !items.length) {
      fail('breadcrumb-items', 'BreadcrumbList is empty')
      continue
    }
    items.forEach((item, index) => {
      if (item.position !== index + 1)
        fail('breadcrumb-position', 'Breadcrumb positions must start at 1 and be contiguous')
      if (!nonempty(item.name) || !absoluteHttp(item.item))
        fail('breadcrumb-value', 'Breadcrumb requires a name and absolute URL')
      if (index < items.length - 1 && !visibleAncestorLinks.has(item.item))
        fail(
          'breadcrumb-visible-link',
          `Ancestor ${item.item} has no matching visible breadcrumb link`,
        )
    })
    const current = normalizedUrl(items.at(-1)?.item, pageUrl)
    if (!current || new URL(current).pathname !== pageUrl.pathname)
      fail('breadcrumb-current', 'Last breadcrumb does not identify the current page')
  }

  for (const list of objects.filter((node) => hasType(node, 'ItemList'))) {
    if (!Array.isArray(list.itemListElement)) {
      fail('item-list', 'ItemList must have an itemListElement array')
      continue
    }
    if (list.numberOfItems !== undefined && list.numberOfItems !== list.itemListElement.length)
      fail('item-list-count', 'ItemList numberOfItems differs from the visible list schema count')
    list.itemListElement.forEach((item, index) => {
      if (item.position !== index + 1)
        fail('item-list-position', 'ListItem positions are not contiguous')
      if (!nonempty(item.name) || !absoluteHttp(item.url))
        fail('item-list-value', 'ListItem requires a name and absolute URL')
      if (
        absoluteHttp(item.url) &&
        !internalLinks.has(new URL(item.url).pathname + new URL(item.url).search)
      )
        fail('item-list-visible-link', `Schema item ${item.url} has no visible anchor`)
    })
  }
  if (requiredType === 'Product' && entity) {
    if (!nonempty(entity.brand?.name)) fail('product-brand', 'Product brand is empty')
    if (entity.aggregateRating && !document.querySelector('[data-product-rating]'))
      warn('rating-visibility', 'Verify that aggregateRating is backed by visible real reviews')
    if (!entity.offers && !entity.aggregateRating && !entity.review)
      warn(
        'product-rich-result',
        'Informational Product schema has no offer or reviews; product/star rich results are not asserted',
      )
  }
  if (requiredType === 'BlogPosting' && entity) {
    if (!nonempty(entity.articleBody)) fail('article-body', 'Article schema has no articleBody')
    if (!entity.author || !entity.publisher)
      fail('article-attribution', 'Article requires author and publisher references')
    for (const field of ['datePublished', 'dateModified']) {
      if (entity[field] && !Number.isFinite(Date.parse(entity[field])))
        fail('article-date', `Invalid ${field}`)
    }
  }
  if (requiredType === 'Service' && entity && !entity.provider)
    fail('service-provider', 'Service requires a provider reference')
  return result
}

async function concurrentMap(values, limit, callback) {
  let index = 0
  const results = new Array(values.length)
  await Promise.all(
    Array.from({ length: Math.min(limit, values.length) }, async () => {
      while (index < values.length) {
        const current = index++
        results[current] = await callback(values[current], current)
      }
    }),
  )
  return results
}

function argumentsFor(argv) {
  const options = {
    base: 'http://localhost:3000',
    output: 'docs/seo/http-audit.json',
    concurrency: 6,
  }
  for (let i = 0; i < argv.length; i++) {
    const [key, inlineValue] = argv[i].split('=', 2)
    const value = inlineValue ?? argv[++i]
    if (key === '--base') options.base = value
    else if (key === '--canonical-origin') options.canonicalOrigin = value
    else if (key === '--output') options.output = value
    else if (key === '--concurrency') options.concurrency = Number(value)
    else throw new Error(`Unknown argument ${key}`)
  }
  if (!absoluteHttp(options.base)) throw new Error('--base must be an HTTP(S) URL')
  if (options.canonicalOrigin && !absoluteHttp(options.canonicalOrigin))
    throw new Error('--canonical-origin must be an HTTP(S) URL')
  if (!Number.isInteger(options.concurrency) || options.concurrency < 1 || options.concurrency > 6)
    throw new Error('--concurrency must be between 1 and 6')
  return options
}

async function get(url) {
  const response = await fetch(url, { redirect: 'manual', signal: AbortSignal.timeout(20000) })
  return {
    status: response.status,
    contentType: response.headers.get('content-type'),
    body: await response.text(),
  }
}

async function inspectImageAsset(publicUrl, base) {
  const source = new URL(publicUrl)
  const requestUrl = new URL(`${source.pathname}${source.search}`, base).toString()
  const result = {
    url: publicUrl,
    requestUrl,
    status: null,
    contentType: null,
    bytes: 0,
    failures: [],
  }
  try {
    const response = await fetch(requestUrl, {
      redirect: 'manual',
      signal: AbortSignal.timeout(20000),
    })
    const bytes = Buffer.from(await response.arrayBuffer())
    result.status = response.status
    result.contentType = response.headers.get('content-type')
    result.bytes = bytes.length
    if (response.status !== 200)
      result.failures.push(`Expected HTTP200; received ${response.status}`)
    if (!result.contentType?.startsWith('image/'))
      result.failures.push(`Expected an image Content-Type; received ${result.contentType}`)
    if (!bytes.length) result.failures.push('Image is empty')
    if (!result.failures.length) {
      const metadata = await sharp(bytes).metadata()
      result.format = metadata.format
      result.width = metadata.width
      result.height = metadata.height
      if (
        source.pathname.endsWith('/favicon-48.png') &&
        (metadata.width !== 48 || metadata.height !== 48)
      )
        result.failures.push('Expected a 48x48 raster favicon')
      if (
        source.pathname.endsWith('/apple-touch-icon.png') &&
        (metadata.width !== 180 || metadata.height !== 180)
      )
        result.failures.push('Expected a 180x180 Apple touch icon')
    }
  } catch (error) {
    result.failures.push(error.message)
  }
  return result
}

export async function runAudit(options) {
  const started = new Date()
  const base = new URL(options.base).origin
  const sitemap = await get(`${base}/sitemap.xml`)
  if (sitemap.status !== 200) throw new Error(`Sitemap returned HTTP ${sitemap.status}`)
  const locations = extractSitemapUrls(sitemap.body)
  if (!locations.length) throw new Error('Sitemap has no URLs')
  if (!locations.every(absoluteHttp)) throw new Error('Sitemap contains a nonabsolute HTTP(S) URL')
  const canonicalOrigin = new URL(options.canonicalOrigin ?? locations[0]).origin
  const sitemapFailures = []
  if (new Set(locations).size !== locations.length) sitemapFailures.push('Duplicate sitemap URLs')
  for (const location of locations) {
    const url = new URL(location)
    if (
      url.origin !== canonicalOrigin ||
      url.search ||
      url.hash ||
      !documentLink(url, canonicalOrigin)
    )
      sitemapFailures.push(`Noncanonical sitemap location: ${location}`)
  }
  const inspect = async ({ path, expectedStatus = 200, source }) => {
    const local = new URL(path, base).toString()
    const publicUrl = new URL(path, canonicalOrigin).toString()
    const begin = performance.now()
    try {
      const response = await get(local)
      return {
        ...auditPageHtml(response.body, {
          url: publicUrl,
          status: response.status,
          expectedStatus,
        }),
        source,
        requestUrl: local,
        contentType: response.contentType,
        elapsedMs: Math.round(performance.now() - begin),
      }
    } catch (error) {
      return {
        path,
        source,
        expectedStatus,
        status: null,
        failures: [{ code: 'request', message: error.message }],
        warnings: [],
        internalLinks: [],
      }
    }
  }
  const initial = Array.from(new Set(locations)).map((location) => ({
    path: new URL(location).pathname,
    source: 'sitemap',
  }))
  console.log(`Checking ${initial.length} sitemap pages from ${base}`)
  const pages = await concurrentMap(initial, options.concurrency, inspect)
  const existing = new Set(initial.map(({ path }) => path))
  const extras = new Map()
  for (const page of pages)
    for (const path of page.internalLinks) {
      if (!existing.has(path)) extras.set(path, { path, source: 'internal-link' })
    }
  for (const path of [
    '/san-pham/catalog?page=2',
    '/san-pham/catalog?q=seo-audit-no-match',
    '/san-pham/catalog?brand=cisco',
    '/san-pham/catalog?category=switch',
    '/bao-hanh?q=INTECH-2099-0001',
  ])
    extras.set(path, { path, source: 'noindex-probe' })
  for (const path of [
    '/san-pham/catalog?page=999999',
    '/san-pham/seo-audit-category-does-not-exist',
    '/san-pham/catalog/seo-audit-product-does-not-exist',
    '/thuong-hieu/seo-audit-brand-does-not-exist',
    '/tin-tuc/seo-audit-article-does-not-exist',
    '/dich-vu/seo-audit-service-does-not-exist',
    '/giai-phap/seo-audit-solution-does-not-exist',
  ])
    extras.set(path, { path, expectedStatus: 404, source: 'missing-route-probe' })
  console.log(`Checking ${extras.size} internal links and query/404 probes`)
  pages.push(...(await concurrentMap(Array.from(extras.values()), options.concurrency, inspect)))
  const robots = await get(`${base}/robots.txt`)
  const robotsFailures = []
  if (robots.status !== 200) robotsFailures.push(`HTTP ${robots.status}`)
  if (!robots.body.includes(`Sitemap: ${canonicalOrigin}/sitemap.xml`))
    robotsFailures.push('Missing canonical sitemap declaration')
  for (const path of ['/admin$', '/admin/', '/api$', '/api/']) {
    if (!robots.body.includes(`Disallow: ${path}`))
      robotsFailures.push(`Missing private endpoint rule ${path}`)
  }
  if (/Disallow:\s*\/(?:_next|images|$)/im.test(robots.body))
    robotsFailures.push('Public rendering resources or all pages are blocked')
  const home = pages.find((page) => page.path === '/')
  const assets = new Set([
    ...(home?.assetUrls ?? []),
    ...['/favicon.svg', '/favicon-48.png', '/apple-touch-icon.png', '/logo.svg'].map((path) =>
      new URL(path, canonicalOrigin).toString(),
    ),
  ])
  const assetChecks = await concurrentMap(Array.from(assets), options.concurrency, (url) =>
    inspectImageAsset(url, base),
  )
  const report = {
    generatedAt: new Date().toISOString(),
    base,
    canonicalOrigin,
    durationMs: Date.now() - started.getTime(),
    scope:
      'All sitemap URLs, internal document links found on those pages, filter/warranty noindex probes, and unknown-route 404 probes. Only GET requests; no forms submitted.',
    limitations:
      'Server HTML and schema syntax/semantics checks only. This does not certify Google rich-result eligibility, JavaScript interaction, mobile layout, PageSpeed, or field Core Web Vitals.',
    sitemap: {
      status: sitemap.status,
      urlCount: locations.length,
      uniqueUrlCount: new Set(locations).size,
      failures: sitemapFailures,
    },
    robots: { status: robots.status, body: robots.body, failures: robotsFailures },
    assets: assetChecks,
    summary: {
      sitemapPages: initial.length,
      additionalPages: extras.size,
      checkedPages: pages.length,
      failedPages: pages.filter((page) => page.failures.length).length,
      failures:
        assetChecks.reduce((sum, asset) => sum + asset.failures.length, 0) +
        sitemapFailures.length +
        robotsFailures.length +
        pages.reduce((sum, page) => sum + page.failures.length, 0),
      warnings: pages.reduce((sum, page) => sum + page.warnings.length, 0),
      paginationPage2Checked: pages.some((page) => page.path === '/san-pham/catalog?page=2'),
      checkedAssets: assetChecks.length,
    },
    pages: pages.sort((a, b) => a.path.localeCompare(b.path)),
  }
  const output = resolve(options.output)
  await mkdir(dirname(output), { recursive: true })
  await writeFile(output, `${JSON.stringify(report, null, 2)}\n`)
  console.log(JSON.stringify({ output, ...report.summary }, null, 2))
  return report
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runAudit(argumentsFor(process.argv.slice(2)))
    .then((report) => {
      if (report.summary.failures) process.exitCode = 1
    })
    .catch((error) => {
      console.error(error.message)
      process.exitCode = 1
    })
}
