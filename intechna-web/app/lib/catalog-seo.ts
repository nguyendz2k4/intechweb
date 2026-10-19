import type { Metadata } from 'next'
import type { Product } from './catalog-types'
import {
  catalogHasFilters,
  catalogPagePath,
  catalogProductPath,
  catalogSlug,
  productImageSource,
  type CatalogSearchParams,
} from '../catalog-utils'
import { absoluteUrl, pageMetadata, websiteId } from './seo'

export function catalogMetadata({
  title,
  description,
  path,
  search,
  page,
}: {
  title: string
  description: string
  path: string
  search: CatalogSearchParams
  page: number
}): Metadata {
  const filtered = catalogHasFilters(search)
  const metadata = pageMetadata({
    title: page > 1 && !filtered ? `${title} – Trang ${page}` : title,
    description,
    path: filtered ? path : catalogPagePath(path, page),
  })
  return filtered ? { ...metadata, robots: { index: false, follow: true } } : metadata
}

type ProductSchemaSource = Pick<Product, 'slug' | 'name' | 'brand' | 'category'> & {
  summary?: string | null
  imageUrl?: string | null
}

export function productSchema(product: ProductSchemaSource) {
  const url = absoluteUrl(catalogProductPath(product.slug))
  const imageSource = productImageSource(product.imageUrl)
  const image = imageSource ? absoluteUrl(imageSource) : undefined
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemPage',
    '@id': `${url}#webpage`,
    url,
    name: product.name,
    inLanguage: 'vi-VN',
    isPartOf: { '@id': websiteId },
    mainEntity: {
      '@type': 'Product',
      '@id': `${url}#product`,
      name: product.name,
      url,
      ...(product.summary?.trim() ? { description: product.summary.trim() } : {}),
      ...(image ? { image: [image] } : {}),
      category: product.category,
      brand: {
        '@type': 'Brand',
        name: product.brand,
        url: absoluteUrl(`/thuong-hieu/${catalogSlug(product.brand)}`),
      },
      mainEntityOfPage: { '@id': `${url}#webpage` },
      // Pricing, availability and ratings must be backed by visible, real product data.
    },
  }
}
