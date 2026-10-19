import Link from 'next/link'
import { Breadcrumbs, CTA } from '@/app/components'
import { getCatalogProducts } from '@/app/catalog-data'
import { catalogCategoryName, catalogSlug } from '@/app/catalog-utils'
import { JsonLd } from '@/app/JsonLd'
import { collectionSchema, pageMetadata } from '@/app/lib/seo'

export const revalidate = 3600

export const metadata = pageMetadata({
  title: 'Thương hiệu thiết bị mạng Cisco, Aruba, Fortinet, MikroTik, Ruijie',
  description:
    'Khám phá thiết bị mạng, WiFi, firewall, router và NAS theo thương hiệu. Intech tư vấn lựa chọn theo hiện trạng và ngân sách dự án.',
  path: '/thuong-hieu',
})

export default async function BrandsPage() {
  const products = await getCatalogProducts()
  const brands = Array.from(new Set(products.map((product) => product.brand))).sort()
  return (
    <main className="catalog-page">
      <JsonLd
        data={collectionSchema({
          name: 'Thương hiệu thiết bị mạng',
          description: 'Tìm thiết bị hạ tầng mạng doanh nghiệp theo thương hiệu.',
          path: '/thuong-hieu',
          items: brands.map((brand) => ({
            name: brand,
            path: `/thuong-hieu/${catalogSlug(brand)}`,
          })),
        })}
      />
      <Breadcrumbs current="Thương hiệu" currentPath="/thuong-hieu" />
      <section className="section catalog-intro">
        <p className="eyebrow">Hệ sinh thái thương hiệu</p>
        <h1>
          <span className="sr-only">Thương hiệu thiết bị mạng. </span>
          Công nghệ bạn tin.
          <br />
          Giải pháp bạn cần.
        </h1>
        <div className="catalog-intro-bottom">
          <p className="lead">
            Một điểm đến cho hạ tầng mạng doanh nghiệp. Tìm thiết bị từ thương hiệu quen thuộc và
            chọn cấu hình theo nhu cầu thực tế.
          </p>
          <Link className="catalog-text-link" href="/san-pham/catalog">
            Tất cả thiết bị <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
      <section className="section catalog-brands-section">
        <div className="catalog-brands-grid">
          {brands.map((brand, index) => {
            const models = products.filter((product) => product.brand === brand)
            const categories = Array.from(new Set(models.map((product) => product.categorySlug)))
            return (
              <Link
                className="catalog-brand-card"
                key={brand}
                href={`/thuong-hieu/${catalogSlug(brand)}`}
              >
                <div className="catalog-category-number">
                  <span>{String(index + 1).padStart(2, '0')}</span>
                  <span aria-hidden="true">↗</span>
                </div>
                <h2>{brand}</h2>
                <p>
                  {categories
                    .map((category) => catalogCategoryName(category, products))
                    .join(' · ')}
                </p>
                <span className="catalog-text-link">{models.length} model tham khảo</span>
              </Link>
            )
          })}
        </div>
        {brands.length === 0 && (
          <div className="catalog-empty">
            <h2>Hệ sinh thái thiết bị đang được cập nhật.</h2>
            <p>Intech luôn sẵn sàng tư vấn thương hiệu phù hợp cho dự án.</p>
            <Link href="/lien-he" className="btn primary">
              Yêu cầu tư vấn
            </Link>
          </div>
        )}
      </section>
      <CTA />
    </main>
  )
}
