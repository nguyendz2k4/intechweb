import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs } from '@/app/components'
import { posts } from '@/app/data'

export const metadata: Metadata = {
  title: 'Tin tức và kiến thức hạ tầng mạng doanh nghiệp',
  description: 'Bài viết hướng dẫn về triển khai mạng LAN, firewall, WiFi doanh nghiệp, bảo mật và vận hành hạ tầng CNTT.',
  alternates: { canonical: '/tin-tuc' },
}

export default function NewsPage() {
  return (
    <main>
      <Breadcrumbs current="Tin tức" />
      <section className="section">
        <div className="heading">
          <p className="eyebrow">Tin tức</p>
          <h1>Kiến thức mạng và hạ tầng CNTT cho doanh nghiệp</h1>
          <p className="lead">Các checklist và gợi ý thực tế giúp doanh nghiệp chuẩn bị tốt hơn trước khi triển khai hoặc nâng cấp hệ thống.</p>
        </div>
        <div className="cards">{posts.map((post) => <article className="card" key={post.slug}><h2>{post.title}</h2><p>{post.description}</p><Link href={`/tin-tuc/${post.slug}`}>Đọc thêm</Link></article>)}</div>
      </section>
    </main>
  )
}
