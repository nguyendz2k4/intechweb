import Link from 'next/link'
import Image from 'next/image'
import { Breadcrumbs, CTA } from '@/app/components'
import { productCategories } from '@/app/data'
import { getCatalogProducts } from '@/app/catalog-data'
import { catalogSlug } from '@/app/catalog-utils'
import { JsonLd } from '@/app/JsonLd'
import { collectionSchema, pageMetadata } from '@/app/lib/seo'

export const revalidate = 3600

const categoryImages: Record<string, string> = {
  switch: 'core-switch',
  router: 'router',
  firewall: 'firewall',
  'wifi-access-point': 'wifi-ap',
  'nas-luu-tru': 'nas',
  'module-quang-phu-kien': 'optical-module',
}

export const metadata = pageMetadata({
  title: 'Sản phẩm & thiết bị hạ tầng mạng doanh nghiệp',
  description:
    'Khám phá switch, router, firewall, WiFi, NAS và phụ kiện hạ tầng. Intech tư vấn cấu hình thiết bị theo nhu cầu vận hành của doanh nghiệp.',
  path: '/san-pham',
})

export default async function ProductsPage() {
  const products = await getCatalogProducts()
  const brands = Array.from(new Set(products.map((product) => product.brand))).sort()
  return (
    <main className="catalog-page">
      <JsonLd
        data={collectionSchema({
          name: 'Danh mục thiết bị hạ tầng mạng doanh nghiệp',
          description: 'Chọn thiết bị mạng theo nhu cầu triển khai của doanh nghiệp.',
          path: '/san-pham',
          items: productCategories.map((category) => ({
            name: category.title,
            path: `/san-pham/${category.slug}`,
          })),
        })}
      />
      <Breadcrumbs current="Sản phẩm" currentPath="/san-pham" />
      <section className="section catalog-hub-hero">
        <div>
          <p className="eyebrow">Thiết bị hạ tầng doanh nghiệp</p>
          <h1>
            <span className="sr-only">Sản phẩm thiết bị mạng doanh nghiệp. </span>
            Kết nối tốt.
            <br />
            Vận hành bền.
          </h1>
          <p className="lead">
            Từ kết nối đầu tiên đến một hệ thống hoàn chỉnh. Khám phá thiết bị phù hợp cho hạ tầng
            mạng của bạn.
          </p>
          <div className="actions">
            <Link className="btn primary" href="/san-pham/catalog">
              Khám phá catalog <span aria-hidden="true">↗</span>
            </Link>
            <Link className="catalog-text-link" href="/lien-he">
              Tư vấn cấu hình <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <p className="catalog-hero-note">
            {products.length} model · {brands.length} thương hiệu · Tư vấn theo hiện trạng
          </p>
        </div>
        <div className="catalog-hub-hardware">
          <Image
            src="/images/hardware/infrastructure.webp"
            alt="Render minh họa hệ sinh thái thiết bị mạng"
            width={1536}
            height={1024}
            sizes="(max-width: 800px) 90vw, 600px"
            priority
          />
          <span>Được chọn cho hệ thống của bạn.</span>
        </div>
      </section>
      <section className="section catalog-categories-section">
        <div className="catalog-section-heading">
          <div>
            <p className="eyebrow">Bắt đầu từ nhu cầu</p>
            <h2>
              Mỗi kết nối.
              <br />
              Một thiết bị phù hợp.
            </h2>
          </div>
          <Link href="/san-pham/catalog" className="catalog-text-link">
            Xem tất cả model <span aria-hidden="true">↗</span>
          </Link>
        </div>
        <div className="catalog-category-grid">
          {productCategories.map((category, index) => (
            <Link
              className="catalog-category-card"
              key={category.slug}
              href={`/san-pham/${category.slug}`}
            >
              <div className="catalog-category-number">
                <span>{String(index + 1).padStart(2, '0')}</span>
                <span aria-hidden="true">↗</span>
              </div>
              <Image
                className="catalog-category-image"
                src={`/images/hardware/${categoryImages[category.slug]}.webp`}
                width={960}
                height={640}
                alt={`Render minh họa ${category.title}`}
                sizes="(max-width: 520px) 90vw, (max-width: 800px) 45vw, 380px"
              />
              <h3>{category.title}</h3>
              <p>{category.description}</p>
              <span className="catalog-text-link">
                {products.filter((product) => product.categorySlug === category.slug).length} model
                tham khảo
              </span>
            </Link>
          ))}
        </div>
        <p className="catalog-image-caption">
          Hình ảnh minh họa dòng thiết bị. Chọn model để xem thông tin cấu hình.
        </p>
      </section>
      <section className="section catalog-brand-band">
        <div>
          <p className="eyebrow">Hệ sinh thái thiết bị</p>
          <h2>
            Thương hiệu bạn tin tưởng.
            <br />
            Cấu hình Intech chọn cùng bạn.
          </h2>
        </div>
        <div className="catalog-brand-links">
          {brands.map((brand) => (
            <Link key={brand} href={`/thuong-hieu/${catalogSlug(brand)}`}>
              {brand} <span aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
        <Link className="catalog-text-link" href="/thuong-hieu">
          Khám phá theo thương hiệu <span aria-hidden="true">↗</span>
        </Link>
      </section>
      <CTA />
    </main>
  )
}
