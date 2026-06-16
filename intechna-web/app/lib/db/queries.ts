import { eq, like, desc } from 'drizzle-orm'
import { db } from './index'
import {
  products, posts, services, warranty,
  type NewProduct, type NewPost, type NewService, type NewWarrantyRecord,
} from './schema'

// ── Products ──────────────────────────────────────────────────
export async function getProducts() {
  return db.select().from(products).orderBy(products.createdAt)
}

export async function getProductBySlug(slug: string) {
  const rows = await db.select().from(products).where(eq(products.slug, slug))
  return rows[0] ?? null
}

export async function upsertProduct(data: NewProduct) {
  const existing = await getProductBySlug(data.slug)
  if (existing) {
    await db.update(products).set(data).where(eq(products.slug, data.slug))
  } else {
    await db.insert(products).values(data)
  }
  return getProductBySlug(data.slug)
}

export async function deleteProduct(slug: string) {
  await db.delete(products).where(eq(products.slug, slug))
  return { ok: true }
}

// ── Posts ─────────────────────────────────────────────────────
export async function getPosts() {
  return db.select().from(posts).orderBy(posts.publishedAt)
}

export async function getPostBySlug(slug: string) {
  const rows = await db.select().from(posts).where(eq(posts.slug, slug))
  return rows[0] ?? null
}

export async function upsertPost(data: NewPost) {
  const existing = await getPostBySlug(data.slug)
  if (existing) {
    await db.update(posts).set(data).where(eq(posts.slug, data.slug))
  } else {
    await db.insert(posts).values(data)
  }
  return getPostBySlug(data.slug)
}

export async function deletePost(slug: string) {
  await db.delete(posts).where(eq(posts.slug, slug))
  return { ok: true }
}

// ── Services ──────────────────────────────────────────────────
export async function getServices() {
  return db.select().from(services).orderBy(services.id)
}

export async function getServiceBySlug(slug: string) {
  const rows = await db.select().from(services).where(eq(services.slug, slug))
  return rows[0] ?? null
}

export async function upsertService(data: NewService) {
  const existing = await getServiceBySlug(data.slug)
  if (existing) {
    await db.update(services).set(data).where(eq(services.slug, data.slug))
  } else {
    await db.insert(services).values(data)
  }
  return getServiceBySlug(data.slug)
}

export async function deleteService(slug: string) {
  await db.delete(services).where(eq(services.slug, slug))
  return { ok: true }
}

// ── Warranty ──────────────────────────────────────────────────
export async function getWarrantyRecords() {
  const rows = await db.select().from(warranty).orderBy(warranty.id)
  
  const now = new Date()
  const offset = now.getTimezoneOffset() * 60000
  const localDateStr = new Date(now.getTime() - offset).toISOString().split('T')[0]

  return rows.map((r) => {
    let currentStatus = r.status || 'Còn bảo hành'
    if (currentStatus === 'Còn bảo hành' && r.warrantyUntil && localDateStr > r.warrantyUntil) {
      currentStatus = 'Hết hạn'
    }
    return { ...r, status: currentStatus }
  })
}

export async function searchWarranty(keyword: string) {
  const q = keyword.trim().toLowerCase()
  if (!q) return null
  const all = await getWarrantyRecords()
  return all.find((r) =>
    [r.code, r.serial, r.customer, r.product].some((v) =>
      (v ?? '').toLowerCase().includes(q)
    )
  ) ?? null
}

export async function upsertWarranty(data: NewWarrantyRecord) {
  const rows = await db.select().from(warranty).where(eq(warranty.code, data.code))
  if (rows.length > 0) {
    await db.update(warranty).set(data).where(eq(warranty.code, data.code))
  } else {
    await db.insert(warranty).values(data)
  }
  return data
}

export async function getNextWarrantyCode(year: number) {
  const prefix = `INTECH-${year}-`
  const rows = await db
    .select({ code: warranty.code })
    .from(warranty)
    .where(like(warranty.code, `${prefix}%`))
    .orderBy(desc(warranty.code))
    .limit(1)

  if (rows.length === 0) {
    return `${prefix}0001`
  }

  const lastCode = rows[0].code
  const parts = lastCode.split('-')
  const numPart = parts[parts.length - 1]
  const nextNum = parseInt(numPart, 10) + 1
  const paddedNum = String(nextNum).padStart(4, '0')
  return `${prefix}${paddedNum}`
}

export async function createWarranty(data: NewWarrantyRecord) {
  await db.insert(warranty).values(data)
  return data
}

