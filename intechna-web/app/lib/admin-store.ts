import { promises as fs } from 'node:fs'
import path from 'node:path'
import type { Product } from '../products-data'

const dataDir = path.join(process.cwd(), 'data')
const productsFile = path.join(dataDir, 'admin-products.json')
const postsFile = path.join(dataDir, 'admin-posts.json')
const servicesFile = path.join(dataDir, 'admin-services.json')

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true })
}

async function readJson<T>(file: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(file, 'utf8')
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

async function writeJson<T>(file: string, data: T) {
  await ensureDataDir()
  await fs.writeFile(file, JSON.stringify(data, null, 2), 'utf8')
}

export type AdminPost = { title: string; slug: string; description: string; body?: string }
export type AdminService = { title: string; slug: string; description: string; keywords?: string }

export async function getAdminProducts() {
  return readJson<Product[]>(productsFile, [])
}

export async function saveAdminProduct(product: Product) {
  const products = await getAdminProducts()
  const next = [product, ...products.filter((item) => item.slug !== product.slug)]
  await writeJson(productsFile, next)
  return product
}

export async function deleteAdminProduct(slug: string) {
  const products = await getAdminProducts()
  const next = products.filter((item) => item.slug !== slug)
  await writeJson(productsFile, next)
  return { ok: true }
}

export async function getAdminPosts() {
  return readJson<AdminPost[]>(postsFile, [])
}

export async function saveAdminPost(post: AdminPost) {
  const posts = await getAdminPosts()
  const next = [post, ...posts.filter((item) => item.slug !== post.slug)]
  await writeJson(postsFile, next)
  return post
}

export async function deleteAdminPost(slug: string) {
  const posts = await getAdminPosts()
  const next = posts.filter((item) => item.slug !== slug)
  await writeJson(postsFile, next)
  return { ok: true }
}

export async function getAdminServices() {
  return readJson<AdminService[]>(servicesFile, [])
}

export async function saveAdminService(service: AdminService) {
  const services = await getAdminServices()
  const next = [service, ...services.filter((item) => item.slug !== service.slug)]
  await writeJson(servicesFile, next)
  return service
}

export async function deleteAdminService(slug: string) {
  const services = await getAdminServices()
  const next = services.filter((item) => item.slug !== slug)
  await writeJson(servicesFile, next)
  return { ok: true }
}
