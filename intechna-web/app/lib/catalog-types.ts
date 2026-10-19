/** Public product data shared by server projections and the catalog UI. */
export type Product = {
  slug: string
  name: string
  brand: string
  category: string
  categorySlug: string
  badges: string[]
  priceVnd?: number | null
  summary: string
  specs: string[]
  applications: string[]
  imageUrl?: string
  datasheetUrl?: string
}
