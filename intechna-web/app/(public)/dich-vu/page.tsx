import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs, CTA, FAQSection, ProcessSection } from '@/app/components'
import { services } from '@/app/data'
import { getPublicServices } from '@/app/lib/public-services'
import { JsonLd } from '@/app/JsonLd'
import { collectionSchema, pageMetadata } from '@/app/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Dịch vụ thi công mạng LAN/WAN, firewall, WiFi doanh nghiệp',
  description:
    'Intech khảo sát, thiết kế, thi công và bảo trì hạ tầng mạng LAN/WAN, firewall, VPN, WiFi, server, camera cho doanh nghiệp tại Nghệ An.',
  path: '/dich-vu',
})

export const dynamic = 'force-dynamic'

export default async function ServicesPage() {
  const servicePages = await getPublicServices()
  return (
    <main>
      <JsonLd
        data={collectionSchema({
          name: 'Dịch vụ hạ tầng mạng doanh nghiệp',
          description: String(metadata.description),
          path: '/dich-vu',
          items: servicePages.map((service) => ({
            name: service.title,
            path: `/dich-vu/${service.slug}`,
          })),
        })}
      />
      <Breadcrumbs current="Dịch vụ" currentPath="/dich-vu" />
      <section className="section">
        <div className="heading">
          <p className="eyebrow">Dịch vụ</p>
          <h1>Triển khai hạ tầng mạng ổn định, bảo mật và dễ quản trị</h1>
          <p className="lead">
            Intech hỗ trợ từ khảo sát hiện trạng, thiết kế giải pháp, cung cấp thiết bị, thi công,
            cấu hình đến nghiệm thu và bảo trì sau bàn giao.
          </p>
        </div>
        <div className="cards">
          {services.map((s) => (
            <article className="card" key={s.title}>
              <h2>{s.title}</h2>
              <p>{s.desc}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="section surface">
        <div className="heading">
          <p className="eyebrow">Dịch vụ theo nhu cầu</p>
          <h2>Chọn dịch vụ phù hợp với hệ thống của doanh nghiệp</h2>
          <p className="lead">
            Tìm hiểu các hạng mục khảo sát, thi công mạng LAN, triển khai WiFi, firewall và bảo trì
            hệ thống cho văn phòng, bệnh viện, phòng khám hoặc nhà xưởng.
          </p>
        </div>
        <div className="cards">
          {servicePages.map((service) => (
            <article className="card" key={service.slug}>
              <h2>{service.title}</h2>
              <p>{service.description}</p>
              <ul className="mini-list">
                {service.keywords.map((keyword) => (
                  <li key={keyword}>{keyword}</li>
                ))}
              </ul>
              <div className="actions">
                <Link
                  className="btn secondary"
                  href={`/dich-vu/${service.slug}`}
                  aria-label={`Xem dịch vụ: ${service.title}`}
                >
                  Xem chi tiết
                </Link>
              </div>
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
