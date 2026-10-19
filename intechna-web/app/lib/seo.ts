import type { Metadata } from 'next'
import { siteConfig } from '../data'

export function absoluteUrl(path: string) {
  return new URL(path, `${siteConfig.domain}/`).toString()
}

export const organizationId = absoluteUrl('/#organization')
export const websiteId = absoluteUrl('/#website')
export const defaultSocialImage = '/images/hardware/infrastructure.webp'

export function publicImageUrl(image: string | undefined) {
  if (!image?.trim()) return absoluteUrl(defaultSocialImage)
  try {
    const url = new URL(image.trim(), `${siteConfig.domain}/`)
    if ((url.protocol === 'https:' || url.protocol === 'http:') && !url.username && !url.password)
      return url.toString()
  } catch {
    // Missing or malformed CMS images use the existing branded preview.
  }
  return absoluteUrl(defaultSocialImage)
}

export function pageMetadata({
  title,
  description,
  path,
  type = 'website',
  image = defaultSocialImage,
}: {
  title: string
  description: string
  path: string
  type?: 'website' | 'article'
  image?: string
}): Metadata {
  const url = absoluteUrl(path)
  const imageUrl = publicImageUrl(image)
  const socialTitle = `${title} | ${siteConfig.shortName}`
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type,
      locale: 'vi_VN',
      siteName: siteConfig.shortName,
      url,
      title: socialTitle,
      description,
      images: [{ url: imageUrl, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description,
      images: [imageUrl],
    },
  }
}

/** Prevent database content from closing the JSON-LD script element. */
export function serializeJsonLd(value: unknown) {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  }
}

export function webPageSchema({
  name,
  description,
  path,
  type = 'WebPage',
}: {
  name: string
  description: string
  path: string
  type?: 'WebPage' | 'AboutPage' | 'ContactPage' | 'CollectionPage'
}) {
  const url = absoluteUrl(path)
  return {
    '@context': 'https://schema.org',
    '@type': type,
    '@id': `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: 'vi-VN',
    isPartOf: { '@id': websiteId },
    about: { '@id': organizationId },
  }
}

export function collectionSchema({
  name,
  description,
  path,
  items,
}: {
  name: string
  description: string
  path: string
  items: Array<{ name: string; path: string }>
}) {
  return {
    ...webPageSchema({ name, description, path, type: 'CollectionPage' }),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((item, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        url: absoluteUrl(item.path),
      })),
    },
  }
}

export function serviceSchema({
  name,
  description,
  path,
}: {
  name: string
  description: string
  path: string
}) {
  const url = absoluteUrl(path)
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${url}#service`,
    name,
    description,
    url,
    provider: { '@id': organizationId },
    areaServed: { '@type': 'AdministrativeArea', name: 'Nghệ An, Việt Nam' },
    mainEntityOfPage: { '@id': `${url}#webpage` },
  }
}

export const siteSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'ProfessionalService',
      '@id': organizationId,
      name: siteConfig.name,
      alternateName: siteConfig.shortName,
      url: absoluteUrl('/'),
      logo: absoluteUrl('/logo.svg'),
      image: absoluteUrl(defaultSocialImage),
      telephone: '+84395337755',
      email: siteConfig.email,
      address: {
        '@type': 'PostalAddress',
        streetAddress: 'Số 31, ngõ 20, đường Nguyễn Đức Cảnh',
        addressLocality: 'Phường Thành Vinh',
        addressRegion: 'Nghệ An',
        addressCountry: 'VN',
      },
      areaServed: { '@type': 'AdministrativeArea', name: 'Nghệ An, Việt Nam' },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+84395337755',
        email: siteConfig.email,
        contactType: 'sales',
        areaServed: 'VN',
        availableLanguage: ['vi'],
      },
    },
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: absoluteUrl('/'),
      name: siteConfig.shortName,
      description: siteConfig.description,
      inLanguage: 'vi-VN',
      publisher: { '@id': organizationId },
    },
  ],
}
