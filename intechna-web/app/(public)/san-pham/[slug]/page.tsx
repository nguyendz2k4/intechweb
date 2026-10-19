import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs, CTA } from '@/app/components'
import { siteConfig } from '@/app/data'
import { getCatalogProducts } from '@/app/catalog-data'
import {
  catalogCardProducts,
  catalogHasFilters,
  catalogPagePath,
  catalogProductPath,
  catalogSearchString,
  catalogView,
  getCatalogCategories,
  type CatalogSearchParams,
} from '@/app/catalog-utils'
import { JsonLd } from '@/app/JsonLd'
import { collectionSchema } from '@/app/lib/seo'
import { catalogMetadata } from '@/app/lib/catalog-seo'
import { ProductPlaceholder } from '@/app/ProductPlaceholder'
import { CatalogFilter } from '../catalog/CatalogFilter'

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
  const category = getCatalogCategories(products).find((item) => item.slug === slug)
  if (!category) return {}
  const view = catalogView(
    products,
    new URLSearchParams(catalogSearchString(search)),
    undefined,
    slug,
  )
  return catalogMetadata({
    title: category.title,
    description: `${category.description} Liên hệ ${siteConfig.shortName} để được tư vấn cấu hình và báo giá phù hợp.`,
    path: `/san-pham/${category.slug}`,
    search,
    page: view.page,
  })
}

export default async function ProductCategoryPage({
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
  const category = getCatalogCategories(products).find((item) => item.slug === slug)
  if (!category) notFound()
  const categoryProducts = products.filter((product) => product.categorySlug === slug)
  const view = catalogView(
    categoryProducts,
    new URLSearchParams(catalogSearchString(search)),
    undefined,
    slug,
  )
  if (!view.validPage) notFound()
  const categoryPath = `/san-pham/${category.slug}`
  const path = catalogHasFilters(search)
    ? `${categoryPath}?${catalogSearchString(search)}`
    : catalogPagePath(categoryPath, view.page)
  return (
    <main className="catalog-page">
      <JsonLd
        data={collectionSchema({
          name: category.title,
          description: category.description,
          path,
          items: view.visible.map((product) => ({
            name: product.name,
            path: catalogProductPath(product.slug),
          })),
        })}
      />
      <Breadcrumbs
        current={category.title}
        currentPath={categoryPath}
        parents={[{ label: 'Sản phẩm', href: '/san-pham' }]}
      />
      <section className="section catalog-category-hero">
        <div>
          <p className="eyebrow">Danh mục thiết bị · {categoryProducts.length} model</p>
          <h1>{category.title}</h1>
          <p className="lead">{category.description}</p>
          <div className="actions">
            <Link className="btn primary" href="/lien-he">
              Tư vấn cấu hình <span aria-hidden="true">↗</span>
            </Link>
            <Link className="catalog-text-link" href="/san-pham/catalog">
              Toàn bộ catalog <span aria-hidden="true">↗</span>
            </Link>
          </div>
        </div>
        <ProductPlaceholder brand="INTECH" categorySlug={slug} name={category.title} />
      </section>
      {category.useCases.length > 0 && (
        <section className="section catalog-use-cases">
          <p className="eyebrow">Chọn theo nhu cầu vận hành</p>
          <div>
            {category.useCases.map((useCase, index) => (
              <article key={useCase}>
                <span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                <h2>{useCase}</h2>
              </article>
            ))}
          </div>
        </section>
      )}
      <section className="section catalog-list-section">
        <div className="catalog-section-heading">
          <div>
            <p className="eyebrow">Model tham khảo</p>
            <h2>Chọn thiết bị của bạn.</h2>
          </div>
        </div>
        <CatalogFilter
          products={catalogCardProducts(categoryProducts)}
          fixedCategory={slug}
          productHeading="h3"
          initialSearch={catalogSearchString(search)}
        />
      </section>
      <CTA />
    </main>
  )
}
