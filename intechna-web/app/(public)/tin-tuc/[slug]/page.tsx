import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Breadcrumbs, CTA } from '@/app/components'
import { getPublicServices } from '@/app/lib/public-services'
import { JsonLd } from '@/app/JsonLd'
import { getPublicPostBySlug, getPublicPosts } from '@/app/lib/public-posts'
import { publicPostPath } from '@/app/lib/public-posts-data'
import { publicArticleContent } from '@/app/lib/static-articles'
import { articleSchema } from '@/app/lib/editorial-seo'
import { pageMetadata, webPageSchema } from '@/app/lib/seo'

export const revalidate = 3600

export async function generateStaticParams() {
  const posts = await getPublicPosts()
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const post = await getPublicPostBySlug(slug)
  if (!post) notFound()
  const metadata = pageMetadata({
    title: post.title,
    description: post.description,
    path: publicPostPath(post.slug),
    type: 'article',
  })
  return {
    ...metadata,
    openGraph: {
      ...metadata.openGraph,
      type: 'article',
      ...(post.publishedAt ? { publishedTime: post.publishedAt.toISOString() } : {}),
    },
  }
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = await getPublicPostBySlug(slug)
  if (!post) notFound()
  const servicePages = await getPublicServices()
  const path = publicPostPath(post.slug)
  const { sections, blocks, body } = publicArticleContent(post)

  return (
    <main>
      <JsonLd
        data={[
          webPageSchema({ name: post.title, description: post.description, path }),
          articleSchema({
            title: post.title,
            description: post.description,
            path,
            body: [post.description, body].filter(Boolean).join('\n\n'),
            publishedAt: post.publishedAt,
          }),
        ]}
      />
      <Breadcrumbs
        current={post.title}
        parents={[{ label: 'Tin tức', href: '/tin-tuc' }]}
        currentPath={path}
      />
      <article className="section article">
        <p className="eyebrow">Kiến thức</p>
        <h1>{post.title}</h1>
        <p className="lead">{post.description}</p>
        {sections.map((section) => (
          <section key={section.title}>
            <h2>{section.title}</h2>
            <p>{section.body}</p>
          </section>
        ))}
        {blocks.map((block, index) => {
          if (block.type === 'heading') {
            return block.level === 3 ? (
              <h3 key={index}>{block.text}</h3>
            ) : (
              <h2 key={index}>{block.text}</h2>
            )
          }
          if (block.type === 'list')
            return (
              <ul key={index}>
                {block.text.split('\n').map((item, itemIndex) => (
                  <li key={itemIndex}>{item}</li>
                ))}
              </ul>
            )
          return (
            <p key={index} style={{ whiteSpace: 'pre-line' }}>
              {block.text}
            </p>
          )
        })}
        <h2>Gợi ý bước tiếp theo</h2>
        <p>
          Nếu doanh nghiệp chưa có sơ đồ mạng hoặc đang gặp tình trạng WiFi chập chờn, firewall khó
          quản trị, dây mạng không đánh nhãn, nên bắt đầu bằng một buổi khảo sát hiện trạng. Từ đó
          mới đưa ra danh mục thiết bị và phương án thi công chính xác.
        </p>
        <ul>
          {servicePages.slice(0, 4).map((service) => (
            <li key={service.slug}>
              <Link href={`/dich-vu/${service.slug}`}>{service.title}</Link>
            </li>
          ))}
        </ul>
      </article>
      <CTA />
    </main>
  )
}
