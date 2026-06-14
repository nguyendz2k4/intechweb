import type { MetadataRoute } from 'next'
import { posts, productCategories, servicePages, siteConfig, solutionPages } from './data'
import { productList } from './products-data'

const routes = ['', '/gioi-thieu', '/san-pham', '/san-pham/catalog', '/thuong-hieu', '/giai-phap', '/dich-vu', '/du-an', '/tin-tuc', '/bao-gia', '/bao-hanh', '/lien-he']

function slugify(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const brandSlugs = Array.from(new Set(productList.map((product) => product.brand))).map(slugify)

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  return [
    ...routes.map((route) => ({ url: `${siteConfig.domain}${route}`, lastModified: now })),
    ...productCategories.map((item) => ({ url: `${siteConfig.domain}/san-pham/${item.slug}`, lastModified: now })),
    ...productList.map((product) => ({ url: `${siteConfig.domain}/san-pham/catalog/${product.slug}`, lastModified: now })),
    ...brandSlugs.map((slug) => ({ url: `${siteConfig.domain}/thuong-hieu/${slug}`, lastModified: now })),
    ...solutionPages.map((solution) => ({ url: `${siteConfig.domain}/giai-phap/${solution.slug}`, lastModified: now })),
    ...servicePages.map((service) => ({ url: `${siteConfig.domain}/dich-vu/${service.slug}`, lastModified: now })),
    ...posts.map((post) => ({ url: `${siteConfig.domain}/tin-tuc/${post.slug}`, lastModified: now })),
  ]
}
