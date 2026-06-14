import { pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core'
// ── Products ──────────────────────────────────────────────────
export const products = pgTable('products', {
  id:           serial('id').primaryKey(),
  slug:         text('slug').unique().notNull(),
  name:         text('name').notNull(),
  brand:        text('brand').notNull(),
  category:     text('category').notNull(),
  categorySlug: text('category_slug').notNull(),
  badges:       text('badges').array().default([]),
  summary:      text('summary').default(''),
  specs:        text('specs').array().default([]),
  applications: text('applications').array().default([]),
  imageUrl:     text('image_url').default(''),
  datasheetUrl: text('datasheet_url').default(''),
  createdAt:    timestamp('created_at', { withTimezone: true }).defaultNow(),
})

// ── Posts (blog) ──────────────────────────────────────────────
export const posts = pgTable('posts', {
  id:          serial('id').primaryKey(),
  slug:        text('slug').unique().notNull(),
  title:       text('title').notNull(),
  description: text('description').default(''),
  body:        text('body').default(''),
  publishedAt: timestamp('published_at', { withTimezone: true }).defaultNow(),
})

// ── Services ──────────────────────────────────────────────────
export const services = pgTable('services', {
  id:          serial('id').primaryKey(),
  slug:        text('slug').unique().notNull(),
  title:       text('title').notNull(),
  description: text('description').default(''),
  keywords:    text('keywords').default(''),
})

// ── Warranty records ──────────────────────────────────────────
export const warranty = pgTable('warranty', {
  id:            serial('id').primaryKey(),
  code:          text('code').unique().notNull(),
  serial:        text('serial').notNull(),
  customer:      text('customer').notNull(),
  product:       text('product').notNull(),
  purchaseDate:  text('purchase_date').default(''),
  warrantyUntil: text('warranty_until').default(''),
  status:        text('status').default('Còn bảo hành'),
  note:          text('note').default(''),
})

// ── Contact submissions ───────────────────────────────────────
export const contactSubmissions = pgTable('contact_submissions', {
  id:          serial('id').primaryKey(),
  name:        text('name').notNull(),
  phone:       text('phone').notNull(),
  email:       text('email').default(''),
  note:        text('note').default(''),
  submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow(),
  status:      text('status').default('mới'),  // mới | đã xử lý
})

// ── Type exports ──────────────────────────────────────────────
export type Product      = typeof products.$inferSelect
export type NewProduct   = typeof products.$inferInsert
export type Post         = typeof posts.$inferSelect
export type NewPost      = typeof posts.$inferInsert
export type Service      = typeof services.$inferSelect
export type NewService   = typeof services.$inferInsert
export type WarrantyRecord    = typeof warranty.$inferSelect
export type NewWarrantyRecord = typeof warranty.$inferInsert
export type ContactSubmission    = typeof contactSubmissions.$inferSelect
export type NewContactSubmission = typeof contactSubmissions.$inferInsert
