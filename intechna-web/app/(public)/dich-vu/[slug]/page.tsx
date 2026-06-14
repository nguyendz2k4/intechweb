import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Breadcrumbs, CTA } from '@/app/components'
import { servicePages, siteConfig } from '@/app/data'

const faqs = [
  { q: 'Khi nào nên khảo sát trước khi báo giá?', a: 'Nên khảo sát khi hệ thống có nhiều phòng ban, nhiều tầng/khu vực, cần WiFi roaming, camera, firewall, VPN hoặc cần tách VLAN để bảo mật.' },
  { q: 'Intech có cung cấp thiết bị kèm thi công không?', a: 'Có. Intech có thể tư vấn switch, router, firewall, access point, NAS, module quang và phụ kiện theo hiện trạng, sau đó thi công/cấu hình/bàn giao tài liệu.' },
  { q: 'Sau khi bàn giao có tài liệu cấu hình không?', a: 'Có. Hạng mục nên có sơ đồ mạng, IP plan, VLAN, danh sách thiết bị, vị trí cổng/dây, tài khoản quản trị và bản backup cấu hình.' },
  { q: 'Có bảo trì định kỳ sau triển khai không?', a: 'Có thể triển khai theo gói kiểm tra định kỳ: trạng thái thiết bị, backup cấu hình, log firewall, WiFi, camera, dung lượng NAS và khuyến nghị tối ưu.' },
]

export function generateStaticParams() {
  return servicePages.map((service) => ({ slug: service.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const service = servicePages.find((item) => item.slug === slug)
  if (!service) return {}
  return {
    title: `${service.title} tại Nghệ An`,
    description: `${service.description} Liên hệ ${siteConfig.shortName} để khảo sát và tư vấn giải pháp phù hợp.`,
    alternates: { canonical: `/dich-vu/${service.slug}` },
  }
}

export default async function ServiceDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const service = servicePages.find((item) => item.slug === slug)
  if (!service) notFound()

  return (
    <main>
      <Breadcrumbs current={service.title} />
      <section className="section split">
        <div>
          <p className="eyebrow">Dịch vụ Intech</p>
          <h1>{service.title}</h1>
          <p className="lead">{service.description}</p>
          <ul className="mini-list">{service.keywords.map((keyword) => <li key={keyword}>{keyword}</li>)}</ul>
          <div className="actions">
            <Link className="btn primary" href={`tel:${siteConfig.phone}`}>Gọi khảo sát</Link>
            <Link className="btn secondary" href="/lien-he">Gửi nhu cầu</Link>
          </div>
        </div>
        <div className="product-visual"><span>INTECH SERVICE</span><strong>{service.title}</strong></div>
      </section>
      <section className="section surface split">
        <div>
          <p className="eyebrow">Hạng mục thực hiện</p>
          <h2>Intech bàn giao rõ việc, rõ cấu hình, rõ tài liệu</h2>
          <ul className="list">{service.deliverables.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
        <div>
          <p className="eyebrow">Lợi ích</p>
          <h2>Hệ thống dễ vận hành và dễ mở rộng</h2>
          <ul className="list">{service.benefits.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </section>
      <section className="section">
        <div className="heading">
          <p className="eyebrow">Quy trình</p>
          <h2>Quy trình triển khai gọn, phù hợp doanh nghiệp</h2>
        </div>
        <div className="cards">
          {['Khảo sát hiện trạng', 'Đề xuất giải pháp', 'Thi công/cấu hình', 'Nghiệm thu/bảo trì'].map((step, index) => <article className="card" key={step}><p className="eyebrow">Bước {index + 1}</p><h3>{step}</h3><p>Thực hiện theo checklist để hạn chế lỗi phát sinh và giúp khách hàng nắm rõ hệ thống sau bàn giao.</p></article>)}
        </div>
      </section>
      <section className="section surface">
        <div className="heading"><p className="eyebrow">FAQ</p><h2>Câu hỏi thường gặp trước khi triển khai</h2></div>
        <div className="cards">{faqs.map((item) => <article className="card" key={item.q}><h3>{item.q}</h3><p>{item.a}</p></article>)}</div>
      </section>
      <CTA />
    </main>
  )
}
