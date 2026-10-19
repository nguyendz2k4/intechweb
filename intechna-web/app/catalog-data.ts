import { cache } from 'react'
import { connection } from 'next/server'
import { unstable_cache } from 'next/cache'
import {
  getProductBySlug,
  getProducts,
  getProductSlugs,
  getRelatedProducts,
} from './lib/db/queries'
import type { Product } from './lib/catalog-types'
import type { Product as StoredProduct } from './lib/db/schema'
import { CATALOG_CACHE_SECONDS, CATALOG_CACHE_TAG } from './lib/catalog-cache'

function publicProduct(product: StoredProduct): Product {
  return {
    slug: product.slug,
    name: product.name,
    brand: product.brand,
    category: product.category,
    categorySlug: product.categorySlug,
    summary: product.summary ?? '',
    priceVnd: product.priceVnd ?? null,
    badges: product.badges ?? [],
    specs: product.specs ?? [],
    applications: product.applications ?? [],
    imageUrl: product.imageUrl ?? '',
    datasheetUrl: product.datasheetUrl ?? '',
  }
}

const cacheOptions = { revalidate: CATALOG_CACHE_SECONDS, tags: [CATALOG_CACHE_TAG] }

/** Render current prices at request time; reuse tagged data caches and avoid build-time schema reads. */
const cachedCatalogProducts = unstable_cache(
  async (): Promise<Product[]> => (await getProducts()).map(publicProduct),
  ['catalog-products-v2'],
  cacheOptions,
)
export const getCatalogProducts = cache(async () => {
  await connection()
  return cachedCatalogProducts()
})

/** Detail metadata and page share one indexed lookup within a render. */
const cachedCatalogProductBySlug = unstable_cache(
  async (slug: string): Promise<Product | null> => {
    const product = await getProductBySlug(slug)
    return product ? publicProduct(product) : null
  },
  ['catalog-product-v2'],
  cacheOptions,
)
export const getCatalogProductBySlug = cache(async (slug: string) => {
  await connection()
  return cachedCatalogProductBySlug(slug)
})

export const getCatalogProductSlugs = cache(
  unstable_cache(getProductSlugs, ['catalog-product-slugs-v1'], cacheOptions),
)

const cachedRelatedCatalogProducts = unstable_cache(
  async (slug: string, categorySlug: string, brand: string): Promise<Product[]> =>
    (await getRelatedProducts({ slug, categorySlug, brand })).map(publicProduct),
  ['catalog-related-products-v2'],
  cacheOptions,
)
export const getRelatedCatalogProducts = cache(
  async (slug: string, categorySlug: string, brand: string) => {
    await connection()
    return cachedRelatedCatalogProducts(slug, categorySlug, brand)
  },
)
