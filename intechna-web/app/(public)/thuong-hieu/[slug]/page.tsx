import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs, CTA } from '@/app/components'
import { productList } from '@/app/products-data'

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const brands = Array.from(new Set(productList.map((product) => product.brand))).sort().map((brand) => ({ brand, slug: slugify(brand) }))

export function generateStaticParams() {
  return brands.map((brand) => ({ slug: brand.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const brand = brands.find((item) => item.slug === slug)
  if (!brand) return {}
  return {
    title: `Thiết bị ${brand.brand} | Catalog Intech`,
    description: `Danh mục thiết bị ${brand.brand} tham khảo: switch, WiFi, router, firewall, NAS hoặc phụ kiện. Liên hệ Intech để tư vấn cấu hình và báo giá.`,
    alternates: { canonical: `/thuong-hieu/${brand.slug}` },
  }
}

export default async function BrandDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const brand = brands.find((item) => item.slug === slug)
  if (!brand) notFound()
  const products = productList.filter((product) => product.brand === brand.brand)
  const categories = Array.from(new Set(products.map((product) => product.category)))

  return (
    <main>
      <Breadcrumbs current={brand.brand} />
      <section className="section">
        <div className="heading">
          <p className="eyebrow">Thương hiệu</p>
          <h1>Thiết bị {brand.brand} cho hạ tầng mạng doanh nghiệp</h1>
          <p className="lead">Catalog {products.length} model tham khảo. Intech không bán theo kiểu chọn model rời rạc, mà tư vấn thiết bị theo sơ đồ mạng, tải người dùng, yêu cầu bảo mật và khả năng mở rộng.</p>
          <ul className="mini-list">{categories.map((category) => <li key={category}>{category}</li>)}</ul>
        </div>
        <div className="cards">
          {products.map((product) => (
            <article className="card product-card" key={product.slug}>
              <div className="brand-badge">{product.brand.slice(0, 2).toUpperCase()}</div>
              <p className="eyebrow">{product.category}</p>
              <h2>{product.name}</h2>
              <p>{product.summary}</p>
              <div className="actions"><Link className="btn secondary" href={`/san-pham/catalog/${product.slug}`}>Xem chi tiết</Link></div>
            </article>
          ))}
        </div>
      </section>
      <CTA />
    </main>
  )
}
