import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs, CTA } from '@/app/components'
import { solutionPages, siteConfig } from '@/app/data'

export function generateStaticParams() {
  return solutionPages.map((solution) => ({ slug: solution.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const solution = solutionPages.find((item) => item.slug === slug)
  if (!solution) return {}
  return {
    title: `${solution.title} | Intech Nghệ An`,
    description: `${solution.description} Liên hệ Intech để khảo sát và đề xuất cấu hình phù hợp.`,
    alternates: { canonical: `/giai-phap/${solution.slug}` },
  }
}

export default async function SolutionDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const solution = solutionPages.find((item) => item.slug === slug)
  if (!solution) notFound()

  return (
    <main>
      <Breadcrumbs current={solution.title} />
      <section className="section split">
        <div>
          <p className="eyebrow">Giải pháp Intech</p>
          <h1>{solution.title}</h1>
          <p className="lead">{solution.description}</p>
          <ul className="mini-list">{solution.keywords.map((keyword) => <li key={keyword}>{keyword}</li>)}</ul>
          <div className="actions">
            <Link className="btn primary" href={`tel:${siteConfig.phone}`}>Gọi khảo sát</Link>
            <Link className="btn secondary" href="/san-pham/catalog">Xem catalog thiết bị</Link>
          </div>
        </div>
        <div className="product-visual"><span>INTECH SOLUTION</span><strong>{solution.title}</strong></div>
      </section>
      <section className="section surface">
        <div className="spec-grid">
          <div>
            <p className="eyebrow">Nhu cầu thường gặp</p>
            <h2>Những điểm cần xử lý khi thiết kế hệ thống</h2>
            <ul className="list">{solution.needs.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
          <div>
            <p className="eyebrow">Thiết bị đề xuất</p>
            <h2>Cấu hình nên được chọn theo hiện trạng thực tế</h2>
            <ul className="list">{solution.recommended.map((item) => <li key={item}>{item}</li>)}</ul>
          </div>
        </div>
      </section>
      <section className="section">
        <div className="heading"><p className="eyebrow">Quy trình</p><h2>Từ khảo sát đến bàn giao tài liệu vận hành</h2></div>
        <div className="cards">
          {['Khảo sát mặt bằng và thiết bị hiện có', 'Thiết kế sơ đồ mạng/VLAN/WiFi', 'Thi công, cấu hình và test nghiệm thu', 'Bàn giao tài liệu và kế hoạch bảo trì'].map((step, index) => <article className="card" key={step}><p className="eyebrow">Bước {index + 1}</p><h3>{step}</h3><p>Intech triển khai theo checklist để hệ thống rõ ràng, dễ kiểm tra và dễ mở rộng sau này.</p></article>)}
        </div>
      </section>
      <CTA />
    </main>
  )
}
