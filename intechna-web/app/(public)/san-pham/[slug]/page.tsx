import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Breadcrumbs, CTA } from '@/app/components'
import { productCategories, siteConfig } from '@/app/data'

export function generateStaticParams() {
  return productCategories.map((item) => ({ slug: item.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const category = productCategories.find((item) => item.slug === slug)
  if (!category) return {}
  return {
    title: `${category.title} | Thiết bị mạng Intech`,
    description: `${category.description} Liên hệ ${siteConfig.shortName} để được tư vấn cấu hình và báo giá phù hợp.`,
    alternates: { canonical: `/san-pham/${category.slug}` },
  }
}

export default async function ProductCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const category = productCategories.find((item) => item.slug === slug)
  if (!category) notFound()

  return (
    <main>
      <Breadcrumbs current={category.title} />
      <section className="section split">
        <div>
          <p className="eyebrow">Danh mục sản phẩm</p>
          <h1>{category.title}</h1>
          <p className="lead">{category.description}</p>
          <div className="actions">
            <Link className="btn primary" href={`tel:${siteConfig.phone}`}>Tư vấn cấu hình</Link>
            <Link className="btn secondary" href="/lien-he">Yêu cầu báo giá</Link>
          </div>
        </div>
        <div className="card">
          <h2>Dòng thiết bị tham khảo</h2>
          <ul className="mini-list">{category.keywords.map((item) => <li key={item}>{item}</li>)}</ul>
        </div>
      </section>
      <section className="section surface">
        <div className="heading">
          <p className="eyebrow">Ứng dụng thực tế</p>
          <h2>Intech chọn thiết bị theo hiện trạng và mục tiêu vận hành</h2>
        </div>
        <div className="cards">
          {category.useCases.map((item) => <article className="card" key={item}><h3>{item}</h3><p>Khảo sát nhu cầu, đề xuất cấu hình, triển khai và bàn giao tài liệu rõ ràng để hệ thống dễ vận hành lâu dài.</p></article>)}
        </div>
      </section>
      <CTA />
    </main>
  )
}
