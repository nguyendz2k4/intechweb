import type { Product } from './lib/catalog-types'
import { productCategories, siteConfig } from './data'

export type CatalogSearchParams = Record<string, string | string[] | undefined>
export const CATALOG_PAGE_SIZE = 24

export type CatalogCategory = {
  slug: string
  title: string
  description: string
  keywords: string[]
  useCases: string[]
}

/** Public category routes also cover categories added through the product database. */
export function getCatalogCategories(products: Product[]): CatalogCategory[] {
  const categories: CatalogCategory[] = [...productCategories]
  const known = new Set(categories.map((category) => category.slug))
  for (const product of products) {
    const slug = product.categorySlug
    if (known.has(slug) || slug === 'catalog' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) continue
    categories.push({
      slug,
      title: product.category,
      description: `Khám phá thiết bị ${product.category} trong catalog Intech.`,
      keywords: [],
      useCases: [],
    })
    known.add(slug)
  }
  return categories
}

export function catalogCategoryPath(slug: string, products: Product[]) {
  return getCatalogCategories(products).some((category) => category.slug === slug)
    ? `/san-pham/${encodeURIComponent(slug)}`
    : `/san-pham/catalog?category=${encodeURIComponent(slug)}`
}

export function catalogProductPath(slug: string) {
  return `/san-pham/catalog/${encodeURIComponent(slug)}`
}

/** Resolve CMS image URLs consistently in the rendered page and its structured data. */
export function productImageSource(value: string | null | undefined) {
  if (!value?.trim()) return null
  try {
    const url = new URL(value.trim(), `${siteConfig.domain}/`)
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null
    return url.origin === siteConfig.domain ? `${url.pathname}${url.search}${url.hash}` : url.href
  } catch {
    return null
  }
}

export function catalogHasFilters(params: CatalogSearchParams) {
  return ['q', 'brand', 'category'].some((key) => {
    const value = params[key]
    return typeof value === 'string' ? Boolean(value.trim()) : Boolean(value?.length)
  })
}

export function catalogPagePath(path: string, page: number) {
  return page > 1 ? `${path}?page=${page}` : path
}

export function catalogSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export function catalogSearchString(params: CatalogSearchParams) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === 'string') search.set(key, value)
    else if (value?.[0]) search.set(key, value[0])
  }
  return search.toString()
}

export function catalogCategoryName(slug: string, products: Product[]) {
  const names: Record<string, string> = {
    switch: 'Switch',
    router: 'Router',
    firewall: 'Firewall',
    'wifi-access-point': 'WiFi Access Point',
    'module-quang-phu-kien': 'Module quang & phụ kiện',
    'nas-luu-tru': 'NAS & lưu trữ',
  }
  return names[slug] ?? products.find((product) => product.categorySlug === slug)?.category ?? slug
}

export function filterCatalog(
  products: Product[],
  search: URLSearchParams,
  fixedBrand?: string,
  fixedCategory?: string,
) {
  const query = catalogSlug(search.get('q')?.trim() ?? '')
  const brand = catalogSlug(fixedBrand ?? search.get('brand') ?? '')
  const category = fixedCategory ?? search.get('category') ?? ''
  return products.filter((product) => {
    const text = catalogSlug(
      `${product.name} ${product.brand} ${product.category} ${product.summary}`,
    )
    return (
      (!query || text.includes(query)) &&
      (!brand || brand === 'all' || catalogSlug(product.brand) === brand) &&
      (!category || category === 'all' || product.categorySlug === category)
    )
  })
}

/** Keep the server's list schema and the client-rendered page in sync. */
export function catalogView(
  products: Product[],
  search: URLSearchParams,
  fixedBrand?: string,
  fixedCategory?: string,
) {
  const filtered = filterCatalog(products, search, fixedBrand, fixedCategory)
  const totalPages = Math.max(1, Math.ceil(filtered.length / CATALOG_PAGE_SIZE))
  const rawPage = search.get('page')
  const requestedPage = rawPage === null ? 1 : Number(rawPage)
  const validPage =
    rawPage === null ||
    (/^[1-9]\d*$/.test(rawPage) &&
      Number.isSafeInteger(requestedPage) &&
      requestedPage <= totalPages)
  const page = validPage ? requestedPage : 1
  return {
    filtered,
    visible: filtered.slice((page - 1) * CATALOG_PAGE_SIZE, page * CATALOG_PAGE_SIZE),
    page,
    totalPages,
    validPage,
  }
}

export function productKeySpecs(product: Product) {
  const concrete = product.specs.filter((spec) =>
    /\d|poe|vlan|qos|wifi|wi-fi|uplink|vpn|quản trị/i.test(spec),
  )
  return (concrete.length ? concrete : product.specs).slice(0, 3)
}

/** Send only the detail fields actually shown in cards to the interactive catalog. */
export function catalogCardProducts(products: Product[]): Product[] {
  return products.map((product) => ({
    ...product,
    specs: productKeySpecs(product),
    badges: product.badges.slice(0, 3),
    applications: [],
  }))
}
