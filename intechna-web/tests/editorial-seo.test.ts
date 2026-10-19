import assert from 'node:assert/strict'
import { test } from 'node:test'
import { posts, siteConfig } from '../app/data'
import { articleSchema } from '../app/lib/editorial-seo'
import { articleBlocks, mergePublicPosts, publicPostPath } from '../app/lib/public-posts-data'
import { publicArticleContent, staticArticleSections } from '../app/lib/static-articles'
import { absoluteUrl } from '../app/lib/seo'

const now = new Date('2026-10-13T00:00:00Z')
const stored = {
  slug: posts[0].slug,
  title: 'Nội dung đã cập nhật trong CMS',
  description: 'Mô tả từ CMS',
  body: 'Nội dung thật đã được lưu.',
  publishedAt: new Date('2026-10-12T00:00:00Z'),
}

test('public article listings and detail data use the CMS override without duplicate URLs', () => {
  const result = mergePublicPosts([stored], now)
  assert.equal(result.length, posts.length)
  assert.equal(result.filter((post) => post.slug === stored.slug).length, 1)
  const article = result.find((post) => post.slug === stored.slug)
  assert.equal(article?.body, stored.body)
  assert.equal(article?.title, stored.title)
  assert.equal(article?.source, 'database')
  assert.equal(result.find((post) => post.slug === posts[1].slug)?.source, 'static')
})

test('scheduled CMS replacements hide their static fallback until publication', () => {
  const scheduled = { ...stored, publishedAt: new Date('2026-10-14T00:00:00Z') }
  assert.ok(!mergePublicPosts([scheduled], now).some((post) => post.slug === stored.slug))
  assert.ok(
    mergePublicPosts([scheduled], scheduled.publishedAt).some(
      (post) => post.slug === stored.slug && post.source === 'database',
    ),
  )
})

test('new CMS articles have public detail data and undated content stays undated', () => {
  const newPost = { ...stored, slug: 'bai-viet-moi', publishedAt: null }
  const article = mergePublicPosts([newPost], now).find((post) => post.slug === newPost.slug)
  assert.equal(article?.publishedAt, null)
  assert.equal(article?.body, stored.body)
  assert.equal(mergePublicPosts([], now).length, posts.length)
})

test('legacy article slugs remain one URL segment and unusable dot slugs stay out of listings', () => {
  assert.equal(publicPostPath('bài viết/?#'), '/tin-tuc/b%C3%A0i%20vi%E1%BA%BFt%2F%3F%23')
  const result = mergePublicPosts(
    ['.', '..', '', ' ', 'bad\u0000slug'].map((slug) => ({ ...stored, slug })),
    now,
  )
  assert.equal(result.length, posts.length)
})

test('article schema only emits an actual publication date and never fabricates modification dates', () => {
  const input = {
    title: stored.title,
    description: stored.description,
    path: `/tin-tuc/${stored.slug}`,
    body: stored.body,
  }
  const dated = articleSchema({ ...input, publishedAt: stored.publishedAt })
  assert.equal(dated.datePublished, stored.publishedAt.toISOString())
  assert.ok(!('dateModified' in dated))
  assert.ok(!('datePublished' in articleSchema(input)))
  assert.ok(!('datePublished' in articleSchema({ ...input, publishedAt: new Date('invalid') })))
  assert.equal(dated.articleBody, stored.body)
  assert.equal(dated.mainEntityOfPage['@id'], `${dated.url}#webpage`)
  assert.equal(dated.author.name, siteConfig.name)
  assert.equal(dated.publisher.name, siteConfig.name)
  assert.equal(dated.author.url, absoluteUrl('/'))
  assert.equal(dated.url, absoluteUrl(input.path))
  assert.ok(!('image' in dated), 'No article-specific image exists in the current content model')
})

test('CMS body formatting cannot add a second H1 and preserves HTML as text', () => {
  const blocks = articleBlocks('# Heading\n\n<script>alert(1)</script>\n\n- Item A\n- Item B')
  assert.equal(blocks[0].level, 2)
  assert.equal(blocks[1].text, '<script>alert(1)</script>')
  assert.equal(blocks[1].type, 'paragraph')
  assert.ok(blocks.every((block) => block.level === undefined || block.level >= 2))
  assert.deepEqual(blocks[2], { type: 'list', text: 'Item A\nItem B' })
  assert.equal(articleBlocks('### First section')[0].level, 2)
})

test('existing public article URLs retain distinct content matching their topic', () => {
  const bodies = posts.map((post) => {
    const sections = staticArticleSections(post.slug)
    assert.ok(sections.length > 0, `Missing body for ${post.slug}`)
    return sections.map((section) => section.body).join('\n')
  })
  assert.equal(new Set(bodies).size, posts.length)
})

test('seeded CMS rows with empty bodies retain their full existing article content', () => {
  const seeded = publicArticleContent({ ...stored, body: '' })
  assert.equal(seeded.sections.length, staticArticleSections(stored.slug).length)
  assert.ok(seeded.body.length > stored.description.length)
  const edited = publicArticleContent(stored)
  assert.equal(edited.body, stored.body)
  assert.equal(edited.sections.length, 0)
  assert.equal(publicArticleContent({ slug: 'unwritten-new-post', body: '' }).body, '')
})
