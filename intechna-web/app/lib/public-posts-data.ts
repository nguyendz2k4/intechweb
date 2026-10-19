import { posts as staticPosts } from '@/app/data'

export type PublicPost = {
  slug: string
  title: string
  description: string
  body: string
  publishedAt: Date | null
  source: 'database' | 'static'
}

type StoredPost = {
  slug: string
  title: string
  description: string | null
  body: string | null
  publishedAt: Date | null
  status?: 'published' | 'draft'
}

export function publicPostPath(slug: string) {
  return `/tin-tuc/${encodeURIComponent(slug)}`
}

// Keep existing public articles while letting the CMS replace them by slug.
// A scheduled replacement must not expose the older fallback before publication.
export function mergePublicPosts(rows: StoredPost[], now = new Date()): PublicPost[] {
  const databaseSlugs = new Set(rows.map((post) => post.slug))
  const published = rows
    .filter(
      (post) =>
        post.status !== 'draft' &&
        post.slug.trim().length > 0 &&
        post.slug !== '.' &&
        post.slug !== '..' &&
        !/[\u0000-\u001f\u007f]/.test(post.slug) &&
        (post.publishedAt === null || post.publishedAt.getTime() <= now.getTime()),
    )
    .map((post): PublicPost => ({
      slug: post.slug,
      title: post.title,
      description: post.description ?? '',
      body: post.body ?? '',
      publishedAt: post.publishedAt,
      source: 'database',
    }))
    .sort((a, b) => (b.publishedAt?.getTime() ?? 0) - (a.publishedAt?.getTime() ?? 0))

  return [
    ...published,
    ...staticPosts
      .filter((post) => !databaseSlugs.has(post.slug))
      .map((post): PublicPost => ({
        ...post,
        body: '',
        publishedAt: null,
        source: 'static',
      })),
  ]
}

export type ArticleBlock = {
  type: 'paragraph' | 'heading' | 'list'
  text: string
  level?: 2 | 3
}

// The CMS stores plain text. Render it as escaped text, with optional Markdown
// headings/lists, rather than injecting untrusted HTML or a second page H1.
export function articleBlocks(body: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = []
  let paragraphs: string[] = []
  let list: string[] = []
  let hasSectionHeading = false
  function flushParagraph() {
    if (paragraphs.length) blocks.push({ type: 'paragraph', text: paragraphs.join('\n') })
    paragraphs = []
  }
  function flushList() {
    if (list.length) blocks.push({ type: 'list', text: list.join('\n') })
    list = []
  }
  for (const line of body.replace(/\r\n?/g, '\n').split('\n')) {
    if (!line.trim()) {
      flushParagraph()
      flushList()
      continue
    }
    const heading = line.match(/^(#{1,6})\s+(.+)$/)
    if (heading) {
      flushParagraph()
      flushList()
      blocks.push({
        type: 'heading',
        text: heading[2],
        level: heading[1].length <= 2 || !hasSectionHeading ? 2 : 3,
      })
      hasSectionHeading = true
      continue
    }
    const item = line.match(/^[-*]\s+(.+)$/)
    if (item) {
      flushParagraph()
      list.push(item[1])
      continue
    }
    flushList()
    paragraphs.push(line)
  }
  flushParagraph()
  flushList()
  return blocks
}
