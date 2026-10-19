import { randomBytes } from 'node:crypto'
import { and, count, eq, desc, ne } from 'drizzle-orm'
import { db } from './index'
import { isDuplicateEntry } from './mysql-client.mjs'
import { adminWarrantyRecord } from '../warranty'
import { planWarrantyImport, type ImportLine } from '../warranty-import'
import {
  products,
  posts,
  services,
  warranty,
  contactSubmissions,
  type NewProduct,
  type NewPost,
  type NewService,
  type NewWarrantyRecord,
} from './schema'

// ── Products ──────────────────────────────────────────────────
export async function getProducts(options: { includeDrafts?: boolean } = {}) {
  return db
    .select()
    .from(products)
    .where(options.includeDrafts ? undefined : eq(products.status, 'published'))
    .orderBy(products.createdAt)
}

export async function getProductBySlug(slug: string, options: { includeDrafts?: boolean } = {}) {
  const rows = await db
    .select()
    .from(products)
    .where(
      and(
        eq(products.slug, slug),
        options.includeDrafts ? undefined : eq(products.status, 'published'),
      ),
    )
    .limit(1)
  return rows[0] ?? null
}

export async function getProductSlugs() {
  return db
    .select({ slug: products.slug })
    .from(products)
    .where(eq(products.status, 'published'))
    .orderBy(products.createdAt, products.id)
}

export async function getRelatedProducts(product: {
  slug: string
  categorySlug: string
  brand: string
}) {
  return db
    .select()
    .from(products)
    .where(
      and(
        eq(products.status, 'published'),
        ne(products.slug, product.slug),
        eq(products.categorySlug, product.categorySlug),
        eq(products.brand, product.brand),
      ),
    )
    .orderBy(products.createdAt, products.id)
    .limit(3)
}

export async function deleteProduct(slug: string) {
  await db.delete(products).where(eq(products.slug, slug))
  return { ok: true }
}

export async function createProduct(data: NewProduct) {
  try {
    return await db.transaction(async (tx) => {
      await tx.insert(products).values(data)
      const rows = await tx.select().from(products).where(eq(products.slug, data.slug)).limit(1)
      return rows[0] ?? null
    })
  } catch (error) {
    if (isDuplicateEntry(error)) return null
    throw error
  }
}

export async function updateProduct(data: NewProduct) {
  const { id: _id, createdAt: _createdAt, ...fields } = data
  return db.transaction(async (tx) => {
    await tx.update(products).set(fields).where(eq(products.slug, data.slug))
    const rows = await tx.select().from(products).where(eq(products.slug, data.slug)).limit(1)
    return rows[0] ?? null
  })
}

// ── Posts ─────────────────────────────────────────────────────
export async function getPosts(options: { includeDrafts?: boolean } = {}) {
  return db
    .select()
    .from(posts)
    .where(options.includeDrafts ? undefined : eq(posts.status, 'published'))
    .orderBy(posts.publishedAt)
}

export async function deletePost(slug: string) {
  await db.delete(posts).where(eq(posts.slug, slug))
  return { ok: true }
}

export async function createPost(data: NewPost) {
  try {
    return await db.transaction(async (tx) => {
      await tx.insert(posts).values(data)
      const rows = await tx.select().from(posts).where(eq(posts.slug, data.slug)).limit(1)
      return rows[0] ?? null
    })
  } catch (error) {
    if (isDuplicateEntry(error)) return null
    throw error
  }
}

export async function updatePost(data: NewPost) {
  const { id: _id, ...fields } = data
  return db.transaction(async (tx) => {
    await tx.update(posts).set(fields).where(eq(posts.slug, data.slug))
    const rows = await tx.select().from(posts).where(eq(posts.slug, data.slug)).limit(1)
    return rows[0] ?? null
  })
}

// ── Services ──────────────────────────────────────────────────
export async function getServices() {
  return db.select().from(services).orderBy(services.id)
}

export async function upsertService(data: NewService) {
  const { id: _id, ...fields } = data
  return db.transaction(async (tx) => {
    await tx.insert(services).values(fields).onDuplicateKeyUpdate({ set: fields })
    const rows = await tx.select().from(services).where(eq(services.slug, data.slug)).limit(1)
    return rows[0]
  })
}

export async function createService(data: NewService) {
  try {
    return await db.transaction(async (tx) => {
      await tx.insert(services).values(data)
      const rows = await tx.select().from(services).where(eq(services.slug, data.slug)).limit(1)
      return rows[0] ?? null
    })
  } catch (error) {
    if (isDuplicateEntry(error)) return null
    throw error
  }
}

export async function deleteService(slug: string) {
  await db.delete(services).where(eq(services.slug, slug))
  return { ok: true }
}

// ── Warranty ──────────────────────────────────────────────────
export async function getWarrantyRecords(now = new Date()) {
  const rows = await db.select().from(warranty).orderBy(warranty.id)
  return rows.map((record) => ({
    ...adminWarrantyRecord(record, now),
    storedStatus: record.status,
  }))
}

export async function getNextWarrantyCode() {
  return `INT-${randomBytes(6).toString('hex').toUpperCase()}`
}

export async function createWarranty(data: NewWarrantyRecord) {
  return db.transaction(async (tx) => {
    await tx.insert(warranty).values(data)
    const rows = await tx.select().from(warranty).where(eq(warranty.code, data.code)).limit(1)
    return rows[0] ?? null
  })
}

export async function updateWarranty(data: NewWarrantyRecord) {
  const { id: _id, code, ...fields } = data
  return db.transaction(async (tx) => {
    await tx.update(warranty).set(fields).where(eq(warranty.code, code))
    const rows = await tx.select().from(warranty).where(eq(warranty.code, code)).limit(1)
    return rows[0] ?? null
  })
}

export async function deleteWarranty(code: string) {
  const [result] = await db.delete(warranty).where(eq(warranty.code, code))
  return result.affectedRows > 0
}

export async function importWarrantyRecords(lines: ImportLine[], commit: boolean) {
  return db.transaction(
    async (tx) => {
      // Lock the serial range while importing, so repeated/concurrent imports cannot duplicate it.
      const query = tx.select({ serial: warranty.serial }).from(warranty)
      const existing = commit ? await query.for('update') : await query
      const { ready, ...plan } = planWarrantyImport(
        lines,
        existing.map((row) => row.serial),
      )
      if (!commit || plan.errorCount) return { ...plan, created: 0 }
      if (ready.length) {
        const records = await Promise.all(
          ready.map(async (data) => ({ ...data, code: await getNextWarrantyCode() })),
        )
        await tx.insert(warranty).values(records)
      }
      return { ...plan, created: ready.length }
    },
    { isolationLevel: 'repeatable read' },
  )
}

export async function getContactSubmissions() {
  return db
    .select()
    .from(contactSubmissions)
    .orderBy(desc(contactSubmissions.submittedAt))
    .limit(500)
}

export async function updateContactSubmission(
  id: number,
  status: 'mới' | 'đang xử lý' | 'đã xử lý',
) {
  return db.transaction(async (tx) => {
    await tx.update(contactSubmissions).set({ status }).where(eq(contactSubmissions.id, id))
    const rows = await tx
      .select()
      .from(contactSubmissions)
      .where(eq(contactSubmissions.id, id))
      .limit(1)
    return rows[0] ?? null
  })
}

export async function deleteContactSubmission(id: number) {
  const [result] = await db.delete(contactSubmissions).where(eq(contactSubmissions.id, id))
  return result.affectedRows > 0
}

export async function getAdminCounts(permissions: readonly string[]) {
  const counts: Record<string, number> = {}
  const entries = [
    ['products', products],
    ['posts', posts],
    ['services', services],
    ['warranty', warranty],
    ['contacts', contactSubmissions],
  ] as const
  await Promise.all(
    entries.map(async ([name, table]) => {
      if (!permissions.includes(`${name}:read`)) return
      const rows = await db.select({ value: count() }).from(table)
      counts[name] = rows[0].value
    }),
  )
  return counts
}
