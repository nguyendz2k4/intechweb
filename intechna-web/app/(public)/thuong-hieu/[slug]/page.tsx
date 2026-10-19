import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs, CTA } from '@/app/components'
import { getCatalogProducts } from '@/app/catalog-data'
import {
  catalogCardProducts,
  catalogCategoryName,
  catalogHasFilters,
  catalogPagePath,
  catalogProductPath,
  catalogSearchString,
  catalogSlug,
  catalogView,
  type CatalogSearchParams,
} from '@/app/catalog-utils'
import { JsonLd } from '@/app/JsonLd'
import { collectionSchema } from '@/app/lib/seo'
import { catalogMetadata } from '@/app/lib/catalog-seo'
import { CatalogFilter } from '../../san-pham/catalog/CatalogFilter'

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<CatalogSearchParams>
}): Promise<Metadata> {
  const [{ slug }, search, products] = await Promise.all([
    params,
    searchParams,
    getCatalogProducts(),
  ])
  const brand = products.find((product) => catalogSlug(product.brand) === slug)?.brand
  if (!brand) return {}
  const view = catalogView(products, new URLSearchParams(catalogSearchString(search)), brand)
  return catalogMetadata({
    title: `Thiết bị ${brand} cho doanh nghiệp`,
    description: `Khám phá thiết bị ${brand}. Intech tư vấn cấu hình, chọn model và báo giá cho hạ tầng doanh nghiệp.`,
    path: `/thuong-hieu/${slug}`,
    search,
    page: view.page,
  })
}

export default async function BrandDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<CatalogSearchParams>
}) {
  const [{ slug }, search, products] = await Promise.all([
    params,
    searchParams,
    getCatalogProducts(),
  ])
  const brand = products.find((product) => catalogSlug(product.brand) === slug)?.brand
  if (!brand) notFound()
  const models = products.filter((product) => product.brand === brand)
  const categories = Array.from(new Set(models.map((product) => product.categorySlug)))
  const view = catalogView(models, new URLSearchParams(catalogSearchString(search)), brand)
  if (!view.validPage) notFound()
  const brandPath = `/thuong-hieu/${slug}`
  const path = catalogHasFilters(search)
    ? `${brandPath}?${catalogSearchString(search)}`
    : catalogPagePath(brandPath, view.page)
  return (
    <main className="catalog-page">
      <JsonLd
        data={collectionSchema({
          name: `Thiết bị ${brand}`,
          description: `Khám phá thiết bị ${brand} trong catalog Intech.`,
          path,
          items: view.visible.map((product) => ({
            name: product.name,
            path: catalogProductPath(product.slug),
          })),
        })}
      />
      <Breadcrumbs
        current={brand}
        currentPath={brandPath}
        parents={[{ label: 'Thương hiệu', href: '/thuong-hieu' }]}
      />
      <section className="section catalog-brand-hero">
        <div>
          <p className="eyebrow">Hệ sinh thái thiết bị</p>
          <h1>{brand}</h1>
          <p className="lead">
            Khám phá {models.length} model tham khảo. Chọn thiết bị theo sơ đồ mạng, tải người dùng
            và kế hoạch mở rộng của doanh nghiệp.
          </p>
          <div className="actions">
            <Link className="btn primary" href="/lien-he">
              Tư vấn thiết bị {brand} <span aria-hidden="true">↗</span>
            </Link>
            <Link className="catalog-text-link" href="/thuong-hieu">
              Các thương hiệu khác <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <div className="catalog-brand-summary">
          <span>{String(models.length).padStart(2, '0')}</span>
          <p>model tham khảo</p>
          <ul>
            {categories.map((category) => (
              <li key={category}>
                <Link href={`/san-pham/catalog?brand=${catalogSlug(brand)}&category=${category}`}>
                  {catalogCategoryName(category, products)} <span aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>
      <section className="section catalog-list-section">
        <CatalogFilter
          products={catalogCardProducts(models)}
          fixedBrand={brand}
          initialSearch={catalogSearchString(search)}
        />
      </section>
      <CTA />
    </main>
  )
}
