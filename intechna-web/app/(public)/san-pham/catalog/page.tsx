import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs, CTA, FAQSection } from '@/app/components'
import { productList } from '@/app/products-data'
import { CatalogFilter } from './CatalogFilter'

const categories = Array.from(new Set(productList.map((product) => product.categorySlug)))
const brands = Array.from(new Set(productList.map((product) => product.brand))).sort()
function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export const metadata: Metadata = {
  title: 'Catalog thiết bị mạng Cisco, Aruba, MikroTik, Fortinet, Synology',
  description: 'Danh sách thiết bị mạng, switch, WiFi, router, firewall, NAS tham khảo cho doanh nghiệp. Liên hệ Intech để được tư vấn cấu hình và báo giá.',
  alternates: { canonical: '/san-pham/catalog' },
}

export default function CatalogPage() {
  return (
    <main>
      <Breadcrumbs current="Catalog sản phẩm" />
      <section className="section">
        <div className="heading">
          <p className="eyebrow">Catalog sản phẩm</p>
          <h1>Thiết bị mạng, WiFi, firewall và lưu trữ cho doanh nghiệp</h1>
          <p className="lead">Danh sách model tham khảo được Intech phân nhóm theo nhu cầu triển khai. Có thể lọc nhanh theo hãng, danh mục hoặc tìm model cụ thể.</p>
          <div className="catalog-tools">
            <span>{productList.length} model tham khảo</span>
            <div>{categories.map((item) => <Link key={item} href={`/san-pham/${item}`}>{item}</Link>)}</div>
          </div>
          <ul className="mini-list">{brands.map((brand) => <li key={brand}><Link href={`/thuong-hieu/${slugify(brand)}`}>{brand}</Link></li>)}</ul>
        </div>
        <CatalogFilter products={productList} />
      </section>
      <FAQSection />
      <CTA />
    </main>
  )
}
