import { nextCacheFixture } from './next-cache-fixture'
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { getTableColumns } from 'drizzle-orm'
import { posts as staticPosts, servicePages, solutionPages } from '../app/data'
import { posts, services } from '../app/lib/db/schema'
import { PUBLIC_POSTS_CACHE_TAG, PUBLIC_SERVICES_CACHE_TAG } from '../app/lib/editorial-cache'
import { getPublicPosts, getPublicPostBySlug } from '../app/lib/public-posts'
import { getPublicServices, getPublicSolutions } from '../app/lib/public-services'

function postRow(slug: string, status = 'published', publishedAt: string | null = null) {
  const values: Record<string, unknown> = {
    id: 1,
    slug,
    title: 'CMS article',
    description: 'CMS description',
    body: 'CMS body',
    status,
    published_at: publishedAt?.replace('T', ' ').replace('Z', '') ?? null,
  }
  return Object.values(getTableColumns(posts)).map((column) => values[column.name])
}

function serviceRow(slug: string, status = 'published') {
  const values: Record<string, unknown> = {
    id: 1,
    slug,
    title: 'CMS service',
    description: 'CMS description',
    keywords: 'LAN, WiFi',
    deliverables: JSON.stringify(['Network plan']),
    benefits: JSON.stringify(['Maintainable']),
    status,
  }
  return Object.values(getTableColumns(services)).map((column) => values[column.name])
}

test('public editorial snapshots reuse DB reads, preserve publication rules, and expire independently', async () => {
  const fixture = await nextCacheFixture([PUBLIC_POSTS_CACHE_TAG, PUBLIC_SERVICES_CACHE_TAG])
  const previousDatabaseUrl = process.env.DATABASE_URL
  // Create a pool locally; intercept every query before opening a connection.
  process.env.DATABASE_URL = 'mysql://fixture:fixture@example.invalid/fixture'
  const db = (await import('../app/lib/db')).db
  const queries = await import('../app/lib/db/queries')
  const originalQuery = db.$client.query
  const calls = { posts: 0, services: 0 }
  let failPosts = false
  let failServices = false
  let storedPosts = [
    postRow(staticPosts[0].slug, 'published', '2000-01-01T00:00:00Z'),
    postRow(staticPosts[1].slug, 'draft'),
    postRow('scheduled-article', 'published', '2999-01-01T00:00:00Z'),
  ]
  let storedServices = [
    serviceRow(servicePages[0].slug),
    serviceRow(servicePages[1].slug, 'draft'),
    serviceRow('new-network-solution'),
    serviceRow(solutionPages[0].slug, 'draft'),
  ]
  db.$client.query = (async (options: { sql: string }) => {
    const sql = options.sql
    if (/from `posts`/.test(sql)) {
      calls.posts += 1
      if (failPosts) throw new Error('Post fixture unavailable')
      return [storedPosts, []]
    }
    if (/from `services`/.test(sql)) {
      calls.services += 1
      if (failServices) throw new Error('Service fixture unavailable')
      return [storedServices, []]
    }
    throw new Error('Unexpected query in editorial cache test')
  }) as unknown as typeof originalQuery
  try {
    const articles = await getPublicPosts()
    assert.equal(articles.find((post) => post.slug === staticPosts[0].slug)?.title, 'CMS article')
    assert.ok(!articles.some((post) => post.slug === staticPosts[1].slug))
    assert.ok(!articles.some((post) => post.slug === 'scheduled-article'))
    const detail = await getPublicPostBySlug(staticPosts[0].slug)
    assert.ok(detail?.publishedAt instanceof Date, 'Cached JSON timestamps must be restored')
    assert.equal(detail.publishedAt.toISOString(), '2000-01-01T00:00:00.000Z')
    assert.equal(await getPublicPostBySlug(staticPosts[1].slug), null)
    assert.equal(await getPublicPostBySlug('scheduled-article'), null)
    assert.equal(calls.posts, 1, 'Listings and details share the DB snapshot across requests')

    const serviceList = await getPublicServices()
    assert.equal(
      serviceList.find((item) => item.slug === servicePages[0].slug)?.title,
      'CMS service',
    )
    assert.ok(!serviceList.some((item) => item.slug === servicePages[1].slug))
    await getPublicServices()
    assert.equal(calls.services, 1)
    const solutionList = await getPublicSolutions()
    assert.equal(
      solutionList.find((item) => item.slug === 'new-network-solution')?.title,
      'CMS service',
    )
    assert.ok(!solutionList.some((item) => item.slug === solutionPages[0].slug))
    assert.equal(calls.services, 1, 'Services and solutions must share the same DB snapshot')

    storedPosts = [postRow(staticPosts[0].slug, 'draft')]
    await fixture.expire([PUBLIC_POSTS_CACHE_TAG])
    assert.equal(await getPublicPostBySlug(staticPosts[0].slug), null)
    assert.equal(calls.posts, 2, 'Publishing changes must take effect on the next public request')
    await getPublicServices()
    assert.equal(calls.services, 1, 'Post invalidation must not evict the service snapshot')

    storedServices = [
      serviceRow(servicePages[0].slug, 'draft'),
      serviceRow('new-network-solution', 'draft'),
    ]
    await fixture.expire([PUBLIC_SERVICES_CACHE_TAG])
    assert.ok(!(await getPublicServices()).some((item) => item.slug === servicePages[0].slug))
    assert.ok(!(await getPublicSolutions()).some((item) => item.slug === 'new-network-solution'))
    assert.ok((await getPublicSolutions()).some((item) => item.slug === solutionPages[0].slug))
    assert.equal(calls.services, 2)
    await getPublicPosts()
    assert.equal(calls.posts, 2, 'Service invalidation must not evict the post snapshot')

    storedPosts = []
    storedServices = []
    await fixture.expire()
    assert.equal((await getPublicPosts()).length, staticPosts.length)
    assert.deepEqual(await getPublicServices(), servicePages)

    // A cache miss that cannot read drafts must fail rather than republish fallback content.
    await fixture.expire()
    failPosts = true
    failServices = true
    await assert.rejects(getPublicPosts)
    await assert.rejects(getPublicPosts)
    await assert.rejects(getPublicServices)
    await assert.rejects(getPublicServices)
    assert.deepEqual(
      calls,
      { posts: 5, services: 5 },
      'Failed reads must not cache empty snapshots',
    )

    failPosts = false
    failServices = false
    await queries.getPosts({ includeDrafts: true })
    await queries.getPosts({ includeDrafts: true })
    await queries.getServices()
    await queries.getServices()
    assert.deepEqual(calls, { posts: 7, services: 7 }, 'Admin repository reads remain uncached')

    delete process.env.DATABASE_URL
    await assert.rejects(getPublicPosts, /MySQL database configuration is not set/)
    assert.deepEqual(calls, { posts: 7, services: 7 })
  } finally {
    db.$client.query = originalQuery
    fixture.restore()
    if (previousDatabaseUrl === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = previousDatabaseUrl
  }
})
