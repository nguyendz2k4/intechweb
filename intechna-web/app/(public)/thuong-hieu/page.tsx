import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs, CTA } from '@/app/components'
import { productList } from '@/app/products-data'

export const metadata: Metadata = {
  title: 'Thương hiệu thiết bị mạng Cisco, Aruba, Fortinet, MikroTik, Ruijie',
  description: 'Danh sách thương hiệu thiết bị mạng, WiFi, firewall, router, NAS và phòng họp Intech tư vấn triển khai cho doanh nghiệp.',
  alternates: { canonical: '/thuong-hieu' },
}

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const brands = Array.from(new Set(productList.map((product) => product.brand))).sort().map((brand) => ({
  brand,
  slug: slugify(brand),
  count: productList.filter((product) => product.brand === brand).length,
  categories: Array.from(new Set(productList.filter((product) => product.brand === brand).map((product) => product.category))).slice(0, 4),
}))

export default function BrandsPage() {
  return (
    <main>
      <Breadcrumbs current="Thương hiệu" />
      <section className="section">
        <div className="heading">
          <p className="eyebrow">Thương hiệu</p>
          <h1>Thiết bị mạng, WiFi, firewall và lưu trữ theo hãng</h1>
          <p className="lead">Intech xây catalog theo hãng để khách hàng dễ tham khảo model, nhóm thiết bị và gửi yêu cầu tư vấn cấu hình/báo giá.</p>
        </div>
        <div className="cards">
          {brands.map((item) => (
            <article className="card" key={item.brand}>
              <p className="eyebrow">{item.count} model</p>
              <h2>{item.brand}</h2>
              <p>Danh mục tham khảo gồm {item.categories.join(', ')}. Intech sẽ tư vấn lựa chọn theo hiện trạng, ngân sách và yêu cầu vận hành.</p>
              <div className="actions"><Link className="btn secondary" href={`/thuong-hieu/${item.slug}`}>Xem sản phẩm {item.brand}</Link></div>
            </article>
          ))}
        </div>
      </section>
      <CTA />
    </main>
  )
}
