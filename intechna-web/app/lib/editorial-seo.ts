import { absoluteUrl, organizationId } from './seo'
import { siteConfig } from '../data'

type ArticleSchemaInput = {
  title: string
  description: string
  path: string
  body: string
  publishedAt?: Date | null
}

export function articleSchema({ title, description, path, body, publishedAt }: ArticleSchemaInput) {
  const url = absoluteUrl(path)
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${url}#article`,
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${url}#webpage` },
    headline: title,
    description,
    articleBody: body,
    inLanguage: 'vi-VN',
    author: {
      '@type': 'Organization',
      '@id': organizationId,
      name: siteConfig.name,
      url: absoluteUrl('/'),
    },
    publisher: {
      '@type': 'Organization',
      '@id': organizationId,
      name: siteConfig.name,
      url: absoluteUrl('/'),
    },
    isPartOf: { '@id': `${absoluteUrl('/tin-tuc')}#blog` },
    ...(publishedAt && Number.isFinite(publishedAt.getTime())
      ? { datePublished: publishedAt.toISOString() }
      : {}),
  }
}
