import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs, CTA, FAQSection, ProcessSection } from '@/app/components'
import { servicePages, services } from '@/app/data'

export const metadata: Metadata = {
  title: 'Dịch vụ thi công mạng LAN/WAN, firewall, WiFi doanh nghiệp',
  description: 'Intech khảo sát, thiết kế, thi công và bảo trì hạ tầng mạng LAN/WAN, firewall, VPN, WiFi, server, camera cho doanh nghiệp tại Nghệ An.',
  alternates: { canonical: '/dich-vu' },
}

export default function ServicesPage() {
  return (
    <main>
      <Breadcrumbs current="Dịch vụ" />
      <section className="section">
        <div className="heading">
          <p className="eyebrow">Dịch vụ</p>
          <h1>Triển khai hạ tầng mạng ổn định, bảo mật và dễ quản trị</h1>
          <p className="lead">Intech hỗ trợ từ khảo sát hiện trạng, thiết kế giải pháp, cung cấp thiết bị, thi công, cấu hình đến nghiệm thu và bảo trì sau bàn giao.</p>
        </div>
        <div className="cards">
          {services.map((s) => <article className="card" key={s.title}><h2>{s.title}</h2><p>{s.desc}</p></article>)}
        </div>
      </section>
      <section className="section surface">
        <div className="heading">
          <p className="eyebrow">Landing page SEO</p>
          <h2>Dịch vụ chi tiết theo nhu cầu tìm kiếm của khách hàng</h2>
          <p className="lead">Các trang này dùng để đẩy SEO cho nhóm từ khóa thi công mạng LAN, WiFi doanh nghiệp, firewall, bảo trì hệ thống mạng, bệnh viện và nhà xưởng.</p>
        </div>
        <div className="cards">
          {servicePages.map((service) => (
            <article className="card" key={service.slug}>
              <h2>{service.title}</h2>
              <p>{service.description}</p>
              <ul className="mini-list">{service.keywords.map((keyword) => <li key={keyword}>{keyword}</li>)}</ul>
              <div className="actions"><Link className="btn secondary" href={`/dich-vu/${service.slug}`}>Xem chi tiết</Link></div>
            </article>
          ))}
        </div>
      </section>
      <ProcessSection />
      <FAQSection />
      <CTA />
    </main>
  )
}
