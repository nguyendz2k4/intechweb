import type { MetadataRoute } from 'next'
import { siteConfig } from './data'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin/', '/api/admin/'] }],
    sitemap: `${siteConfig.domain}/sitemap.xml`,
  }
}
