import type { MetadataRoute } from 'next'
import { getCatalogProducts } from './catalog-data'
import { getCatalogCategories } from './catalog-utils'
import { getPublicPosts } from './lib/public-posts'
import { getPublicServices, getPublicSolutions } from './lib/public-services'
import { buildPublicSitemap } from './lib/seo-indexing'

// Database additions and deletions must not wait for another deployment.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [products, posts, services, solutions] = await Promise.all([
    getCatalogProducts(),
    getPublicPosts(),
    getPublicServices(),
    getPublicSolutions(),
  ])
  return buildPublicSitemap({
    products,
    categories: getCatalogCategories(products),
    posts,
    services,
    solutions,
  })
}
