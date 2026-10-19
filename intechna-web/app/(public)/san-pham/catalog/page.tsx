import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs, CTA } from '@/app/components'
import { getCatalogProducts } from '@/app/catalog-data'
import {
  catalogCardProducts,
  catalogHasFilters,
  catalogPagePath,
  catalogProductPath,
  catalogSearchString,
  catalogView,
  type CatalogSearchParams,
} from '@/app/catalog-utils'
import { JsonLd } from '@/app/JsonLd'
import { collectionSchema } from '@/app/lib/seo'
import { catalogMetadata } from '@/app/lib/catalog-seo'
import { CatalogFilter } from './CatalogFilter'

const title = 'Catalog thiết bị mạng Cisco, Aruba, MikroTik, Fortinet, Synology'
const description =
  'Tìm switch, WiFi, router, firewall và NAS theo model, thương hiệu hoặc loại thiết bị. Intech tư vấn cấu hình và báo giá phù hợp.'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>
}) {
  const [products, search] = await Promise.all([getCatalogProducts(), searchParams])
  const view = catalogView(products, new URLSearchParams(catalogSearchString(search)))
  return catalogMetadata({ title, description, path: '/san-pham/catalog', search, page: view.page })
}

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<CatalogSearchParams>
}) {
  const [products, search] = await Promise.all([getCatalogProducts(), searchParams])
  const view = catalogView(products, new URLSearchParams(catalogSearchString(search)))
  if (!view.validPage) notFound()
  const path = catalogHasFilters(search)
    ? `/san-pham/catalog?${catalogSearchString(search)}`
    : catalogPagePath('/san-pham/catalog', view.page)
  return (
    <main className="catalog-page">
      <JsonLd
        data={collectionSchema({
          name: title,
          description,
          path,
          items: view.visible.map((product) => ({
            name: product.name,
            path: catalogProductPath(product.slug),
          })),
        })}
      />
      <Breadcrumbs
        current="Catalog thiết bị"
        currentPath="/san-pham/catalog"
        parents={[{ label: 'Sản phẩm', href: '/san-pham' }]}
      />
      <section className="section catalog-intro">
        <p className="eyebrow">Catalog thiết bị</p>
        <h1>
          <span className="sr-only">Catalog thiết bị mạng. </span>
          Thiết bị đúng.
          <br />
          Hệ thống vững.
        </h1>
        <div className="catalog-intro-bottom">
          <p className="lead">
            Tìm model theo hãng, loại thiết bị hoặc nhu cầu triển khai. Cấu hình cuối cùng được chọn
            cùng kỹ sư Intech.
          </p>
          <Link className="catalog-text-link" href="/thuong-hieu">
            Khám phá thương hiệu <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
      <section className="section catalog-list-section" aria-label="Duyệt catalog">
        <CatalogFilter
          products={catalogCardProducts(products)}
          initialSearch={catalogSearchString(search)}
        />
      </section>
      <CTA />
    </main>
  )
}
