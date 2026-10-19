import type { MetadataRoute } from 'next'
import { catalogSlug } from '../catalog-utils'
import { servicePages, solutionPages } from '../data'
import { absoluteUrl } from './seo'

const publicRoutes = [
  '/',
  '/gioi-thieu',
  '/san-pham',
  '/san-pham/catalog',
  '/thuong-hieu',
  '/giai-phap',
  '/dich-vu',
  '/du-an',
  '/tin-tuc',
  '/bao-gia',
  '/bao-hanh',
  '/lien-he',
] as const

type SluggedPage = { slug: string }

type SitemapSources = {
  products: ReadonlyArray<SluggedPage & { brand: string }>
  categories: ReadonlyArray<SluggedPage>
  posts: ReadonlyArray<SluggedPage>
  services?: ReadonlyArray<SluggedPage>
  solutions?: ReadonlyArray<SluggedPage>
}

/** A slug represents one route segment, never a query, fragment or traversal. */
function routeSegment(slug: string) {
  if (!slug || slug === '.' || slug === '..' || /[\u0000-\u001f\u007f]/.test(slug)) return null
  return encodeURIComponent(slug)
}

export function buildPublicSitemap({
  products,
  categories,
  posts,
  services = servicePages,
  solutions = solutionPages,
}: SitemapSources): MetadataRoute.Sitemap {
  const paths = new Set<string>(publicRoutes)
  const addPage = (prefix: string, slug: string) => {
    const segment = routeSegment(slug)
    if (segment) paths.add(`${prefix}/${segment}`)
  }

  categories.forEach(({ slug }) => addPage('/san-pham', slug))
  products.forEach(({ slug, brand }) => {
    addPage('/san-pham/catalog', slug)
    addPage('/thuong-hieu', catalogSlug(brand))
  })
  posts.forEach(({ slug }) => addPage('/tin-tuc', slug))
  services.forEach(({ slug }) => addPage('/dich-vu', slug))
  solutions.forEach(({ slug }) => addPage('/giai-phap', slug))

  // No updatedAt is tracked yet. A creation/publication date or request time
  // would misrepresent the last significant content change, so omit lastmod.
  return Array.from(paths)
    .sort()
    .map((path) => ({ url: absoluteUrl(path) }))
}
