import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs, CTA, FAQSection, ProcessSection } from '@/app/components'
import { handoverItems } from '@/app/data'
import { getPublicSolutions } from '@/app/lib/public-services'
import { JsonLd } from '@/app/JsonLd'
import { collectionSchema, pageMetadata } from '@/app/lib/seo'

export const metadata: Metadata = pageMetadata({
  title: 'Giải pháp hạ tầng mạng cho văn phòng, nhà xưởng, bệnh viện, khách sạn',
  description:
    'Intech tư vấn giải pháp mạng LAN, WiFi, firewall, camera, NAS cho văn phòng, nhà xưởng, bệnh viện/phòng khám, khách sạn và trường học.',
  path: '/giai-phap',
})

export const dynamic = 'force-dynamic'

export default async function SolutionsPage() {
  const solutions = await getPublicSolutions()
  return (
    <main>
      <JsonLd
        data={collectionSchema({
          name: 'Giải pháp hạ tầng mạng theo mô hình doanh nghiệp',
          description: String(metadata.description),
          path: '/giai-phap',
          items: solutions.map((solution) => ({
            name: solution.title,
            path: `/giai-phap/${solution.slug}`,
          })),
        })}
      />
      <Breadcrumbs current="Giải pháp" currentPath="/giai-phap" />
      <section className="section">
        <div className="heading">
          <p className="eyebrow">Giải pháp</p>
          <h1>Hạ tầng mạng theo từng mô hình vận hành thực tế</h1>
          <p className="lead">
            Mỗi môi trường có yêu cầu khác nhau về vùng phủ WiFi, bảo mật, camera, lưu trữ, số lượng
            người dùng và khả năng mở rộng. Intech thiết kế giải pháp theo hiện trạng thay vì áp một
            cấu hình chung.
          </p>
        </div>
        <div className="cards">
          {solutions.map((solution) => (
            <article className="card" key={solution.slug}>
              <p className="eyebrow">
                {solution.contentType === 'service' ? 'Dịch vụ & giải pháp' : 'Giải pháp ngành'}
              </p>
              <h2>{solution.title}</h2>
              <p>{solution.description}</p>
              <ul className="mini-list">
                {solution.keywords.map((keyword) => (
                  <li key={keyword}>{keyword}</li>
                ))}
              </ul>
              <div className="actions">
                <Link
                  className="btn secondary"
                  href={`/giai-phap/${solution.slug}`}
                  aria-label={`Xem giải pháp: ${solution.title}`}
                >
                  Xem chi tiết
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="section surface split">
        <div>
          <p className="eyebrow">Bàn giao</p>
          <h2>Giải pháp tốt phải có tài liệu để vận hành sau này</h2>
        </div>
        <ul className="list">
          {handoverItems.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
      <ProcessSection />
      <FAQSection />
      <CTA />
    </main>
  )
}
