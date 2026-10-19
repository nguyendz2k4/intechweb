import { cache } from 'react'
import { unstable_cache } from 'next/cache'
import { EDITORIAL_CACHE_SECONDS, PUBLIC_POSTS_CACHE_TAG } from './editorial-cache'
import { mergePublicPosts } from './public-posts-data'
import { databaseConfigured } from './db/mysql-client.mjs'

const getStoredPosts = unstable_cache(
  async () => {
    const { getPosts } = await import('./db/queries')
    // Cache the snapshot, including drafts; filter publication at render time.
    return (await getPosts({ includeDrafts: true })).map((post) => ({
      ...post,
      publishedAt: post.publishedAt?.toISOString() ?? null,
    }))
  },
  ['public-posts', 'v1'],
  { tags: [PUBLIC_POSTS_CACHE_TAG], revalidate: EDITORIAL_CACHE_SECONDS },
)

export const getPublicPosts = cache(async () => {
  if (!databaseConfigured()) {
    throw new Error('MySQL database configuration is not set.')
  }
  const rows = await getStoredPosts()
  // Next's data cache serializes JSON, so restore dates on misses and hits alike.
  return mergePublicPosts(
    rows.map((post) => ({
      ...post,
      publishedAt: post.publishedAt === null ? null : new Date(post.publishedAt),
    })),
  )
})

export const getPublicPostBySlug = cache(async (slug: string) => {
  return (await getPublicPosts()).find((post) => post.slug === slug) ?? null
})
