import type { Metadata } from 'next'
import Link from 'next/link'
import { Breadcrumbs } from '@/app/components'
import { JsonLd } from '@/app/JsonLd'
import { getPublicPosts } from '@/app/lib/public-posts'
import { publicPostPath } from '@/app/lib/public-posts-data'
import { absoluteUrl, collectionSchema, pageMetadata, organizationId } from '@/app/lib/seo'
import styles from './news.module.css'

export const revalidate = 3600

export const metadata: Metadata = pageMetadata({
  title: 'Tin tức và kiến thức hạ tầng mạng doanh nghiệp',
  description:
    'Bài viết hướng dẫn về triển khai mạng LAN, firewall, WiFi doanh nghiệp, bảo mật và vận hành hạ tầng CNTT.',
  path: '/tin-tuc',
})

export default async function NewsPage() {
  const posts = await getPublicPosts()

  return (
    <main>
      <JsonLd
        data={[
          collectionSchema({
            name: 'Tin tức và kiến thức hạ tầng mạng doanh nghiệp',
            description: String(metadata.description),
            path: '/tin-tuc',
            items: posts.map((post) => ({ name: post.title, path: publicPostPath(post.slug) })),
          }),
          {
            '@context': 'https://schema.org',
            '@type': 'Blog',
            '@id': `${absoluteUrl('/tin-tuc')}#blog`,
            url: absoluteUrl('/tin-tuc'),
            name: 'Kiến thức mạng và hạ tầng CNTT cho doanh nghiệp',
            inLanguage: 'vi-VN',
            publisher: { '@id': organizationId },
            blogPost: posts.map((post) => ({
              '@id': `${absoluteUrl(publicPostPath(post.slug))}#article`,
            })),
          },
        ]}
      />
      <Breadcrumbs current="Tin tức" currentPath="/tin-tuc" />
      <section className="section">
        <div className="heading">
          <p className="eyebrow">Tin tức</p>
          <h1>Kiến thức mạng và hạ tầng CNTT cho doanh nghiệp</h1>
          <p className="lead">
            Các checklist và gợi ý thực tế giúp doanh nghiệp chuẩn bị tốt hơn trước khi triển khai
            hoặc nâng cấp hệ thống.
          </p>
        </div>
        <div className="cards">
          {posts.length === 0 ? (
            <article className="card">
              <p className="eyebrow">Chưa có bài viết</p>
              <h2>Kho nội dung đang trống</h2>
              <p>Nội dung đang được cập nhật. Vui lòng quay lại sau để đọc các bài viết mới.</p>
            </article>
          ) : (
            posts.map((post) => (
              <article key={post.slug}>
                <Link
                  className={`card ${styles.newsCard}`}
                  href={publicPostPath(post.slug)}
                  aria-label={`Đọc bài: ${post.title}`}
                >
                  <h2 className={styles.title}>{post.title}</h2>
                </Link>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  )
}
