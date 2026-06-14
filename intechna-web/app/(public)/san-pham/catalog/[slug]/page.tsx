import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Breadcrumbs, CTA } from '@/app/components'
import { siteConfig } from '@/app/data'
import { getAdminProducts } from '@/app/lib/admin-store'
import { productList } from '@/app/products-data'

export function generateStaticParams() {
  return productList.map((product) => ({ slug: product.slug }))
}

async function allProducts() {
  return [...productList, ...(await getAdminProducts())]
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const product = (await allProducts()).find((item) => item.slug === slug)
  if (!product) return {}
  return {
    title: `${product.name} | ${product.category} Intech`,
    description: `${product.summary} Liên hệ Intech để tư vấn cấu hình, triển khai và báo giá ${product.name}.`,
    alternates: { canonical: `/san-pham/catalog/${product.slug}` },
  }
}

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const product = (await allProducts()).find((item) => item.slug === slug)
  if (!product) notFound()

  return (
    <main>
      <Breadcrumbs current={product.name} />
      <section className="section split">
        <div>
          <p className="eyebrow">{product.brand} / {product.category}</p>
          <h1>{product.name}</h1>
          <p className="lead">{product.summary}</p>
          <ul className="mini-list">{product.badges.map((badge) => <li key={badge}>{badge}</li>)}</ul>
          <div className="actions">
            <Link className="btn primary" href={`tel:${siteConfig.phone}`}>Liên hệ báo giá</Link>
            <Link className="btn secondary" href={`/san-pham/${product.categorySlug}`}>Xem cùng danh mục</Link>
            {product.datasheetUrl && <a className="btn secondary" href={product.datasheetUrl} target="_blank" rel="noopener noreferrer">Tải datasheet PDF</a>}
          </div>
        </div>
        <div className="product-visual">
          {product.imageUrl ? <img className="product-detail-image" src={product.imageUrl} alt={product.name} /> : <><span>{product.brand}</span><strong>{product.name}</strong></>}
        </div>
      </section>
      <section className="section surface">
        <div className="spec-grid">
          <div><p className="eyebrow">Thông số tư vấn</p><h2>Điểm cần kiểm tra trước khi chọn thiết bị</h2><ul className="list">{product.specs.map((spec) => <li key={spec}>{spec}</li>)}</ul></div>
          <div><p className="eyebrow">Ứng dụng</p><h2>Phù hợp cho các nhu cầu triển khai</h2><ul className="list">{product.applications.map((item) => <li key={item}>{item}</li>)}</ul></div>
        </div>
      </section>
      <section className="section"><div className="quote-box"><p className="eyebrow">Tư vấn cấu hình</p><h2>Không chắc model này có phù hợp không?</h2><p>Gửi Intech hiện trạng số lượng người dùng, mặt bằng, thiết bị đang có và mục tiêu triển khai. Intech sẽ gợi ý cấu hình phù hợp hơn thay vì chỉ bán đúng một mã sản phẩm.</p><div className="actions"><Link className="btn primary" href={`tel:${siteConfig.phone}`}>Gọi {siteConfig.phoneDisplay}</Link><Link className="btn secondary" href="/lien-he">Gửi yêu cầu tư vấn</Link></div></div></section>
      <CTA />
    </main>
  )
}
