import {
  bigint,
  check,
  datetime,
  index,
  int,
  json,
  mediumtext,
  mysqlEnum,
  mysqlTable,
  primaryKey,
  text,
  varchar,
} from 'drizzle-orm/mysql-core'
import { sql } from 'drizzle-orm'
export type PublicationStatus = 'published' | 'draft'
const id = () => int('id').autoincrement().primaryKey()
const slug = () => varchar('slug', { length: 191 }).unique().notNull()
const utcDate = (name: string) => datetime(name, { mode: 'date', fsp: 3 })
const now = sql`(UTC_TIMESTAMP(3))`
export const products = mysqlTable('products', {
  id: id(),
  slug: slug(),
  name: text('name').notNull(),
  brand: text('brand').notNull(),
  category: text('category').notNull(),
  categorySlug: varchar('category_slug', { length: 191 }).notNull(),
  badges: json('badges').$type<string[]>(),
  summary: text('summary'),
  priceVnd: bigint('price_vnd', { mode: 'number', unsigned: true }),
  specs: json('specs').$type<string[]>(),
  applications: json('applications').$type<string[]>(),
  imageUrl: text('image_url'),
  datasheetUrl: text('datasheet_url'),
  status: mysqlEnum('status', ['published', 'draft']).notNull().default('published'),
  createdAt: utcDate('created_at').default(now),
})
export const posts = mysqlTable('posts', {
  id: id(),
  slug: slug(),
  title: text('title').notNull(),
  description: text('description'),
  body: mediumtext('body'),
  status: mysqlEnum('status', ['published', 'draft']).notNull().default('published'),
  publishedAt: utcDate('published_at').default(now),
})
export const services = mysqlTable('services', {
  id: id(),
  slug: slug(),
  title: text('title').notNull(),
  description: text('description'),
  keywords: text('keywords'),
  deliverables: json('deliverables').$type<string[]>().notNull(),
  benefits: json('benefits').$type<string[]>().notNull(),
  status: mysqlEnum('status', ['published', 'draft']).notNull().default('draft'),
})
export const warranty = mysqlTable('warranty', {
  id: id(),
  code: varchar('code', { length: 191 }).unique().notNull(),
  serial: text('serial').notNull(),
  customer: text('customer').notNull(),
  product: text('product').notNull(),
  model: text('model'),
  purchaseDate: varchar('purchase_date', { length: 10 }),
  warrantyUntil: varchar('warranty_until', { length: 10 }),
  status: varchar('status', { length: 80 }).default('Còn bảo hành'),
  note: text('note'),
})
export const contactSubmissions = mysqlTable('contact_submissions', {
  id: id(),
  name: text('name').notNull(),
  phone: text('phone').notNull(),
  email: text('email'),
  note: text('note'),
  submittedAt: utcDate('submitted_at').default(now),
  status: mysqlEnum('status', ['mới', 'đang xử lý', 'đã xử lý']).notNull().default('mới'),
})
export const securityRateLimits = mysqlTable(
  'security_rate_limits',
  {
    bucketHash: varchar('bucket_hash', { length: 64 }).primaryKey(),
    count: int('count').notNull(),
    expiresAt: utcDate('expires_at').notNull(),
  },
  (table) => [
    check('security_rate_limits_count_check', sql`${table.count} > 0`),
    index('security_rate_limits_expiry_idx').on(table.expiresAt),
  ],
)
export const securityTotpReplays = mysqlTable(
  'security_totp_replays',
  {
    accountHash: varchar('account_hash', { length: 64 }).notNull(),
    counter: bigint('counter', { mode: 'number' }).notNull(),
    expiresAt: utcDate('expires_at').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.accountHash, table.counter] }),
    index('security_totp_replays_expiry_idx').on(table.expiresAt),
  ],
)
export const securityAdminCredentials = mysqlTable('security_admin_credentials', {
  username: varchar('username', { length: 80 }).primaryKey(),
  passwordHash: text('password_hash'),
  totpEncrypted: text('totp_encrypted'),
  revision: varchar('revision', { length: 64 }).notNull(),
  updatedAt: utcDate('updated_at').notNull().default(now),
})
export const securityAdminSessions = mysqlTable(
  'security_admin_sessions',
  {
    tokenHash: varchar('token_hash', { length: 64 }).primaryKey(),
    username: varchar('username', { length: 80 }).notNull(),
    version: varchar('version', { length: 64 }).notNull(),
    expiresAt: utcDate('expires_at').notNull(),
    pendingTotp: text('pending_totp'),
    pendingExpiresAt: utcDate('pending_expires_at'),
  },
  (table) => [
    index('security_admin_sessions_username_idx').on(table.username),
    index('security_admin_sessions_expiry_idx').on(table.expiresAt),
  ],
)
export type Product = typeof products.$inferSelect
export type NewProduct = typeof products.$inferInsert
export type Post = typeof posts.$inferSelect
export type NewPost = typeof posts.$inferInsert
export type Service = typeof services.$inferSelect
export type NewService = typeof services.$inferInsert
export type WarrantyRecord = typeof warranty.$inferSelect
export type NewWarrantyRecord = typeof warranty.$inferInsert
export type ContactSubmission = typeof contactSubmissions.$inferSelect
export type NewContactSubmission = typeof contactSubmissions.$inferInsert
