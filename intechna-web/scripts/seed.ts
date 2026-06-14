/**
 * Seed script — chạy một lần để nhập dữ liệu ban đầu vào Neon PostgreSQL
 * Usage: npx tsx scripts/seed.ts
 *
 * Yêu cầu: DATABASE_URL phải có trong .env
 */
import 'dotenv/config'
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'
import { products, posts, warranty } from '../app/lib/db/schema'
import { productList } from '../app/products-data'

// ── Dữ liệu bài viết từ app/data.ts ──────────────────────────
const seedPosts = [
  { slug: 'checklist-trien-khai-mang-lan-van-phong', title: 'Checklist thi công mạng LAN cho văn phòng doanh nghiệp', description: 'Các hạng mục cần chuẩn bị trước khi thi công mạng LAN văn phòng: khảo sát, thiết kế VLAN, thiết bị, tủ rack và nghiệm thu.', body: '' },
  { slug: 'khi-nao-doanh-nghiep-nen-dung-firewall-chuyen-dung', title: 'Khi nào doanh nghiệp nên dùng firewall chuyên dụng?', description: 'Dấu hiệu doanh nghiệp nên nâng cấp firewall chuyên dụng để bảo mật, quản lý truy cập, VPN và giám sát lưu lượng mạng.', body: '' },
  { slug: 'wifi-doanh-nghiep-khac-gi-wifi-gia-dinh', title: 'WiFi doanh nghiệp khác gì WiFi gia đình?', description: 'So sánh WiFi doanh nghiệp với WiFi gia đình qua roaming, controller, VLAN, bảo mật và khả năng chịu tải người dùng.', body: '' },
  { slug: 'thi-cong-mang-benh-vien-phong-kham-can-luu-y-gi', title: 'Thi công mạng bệnh viện/phòng khám cần lưu ý gì?', description: 'Các điểm quan trọng khi thiết kế hạ tầng mạng cho bệnh viện, phòng khám: bảo mật dữ liệu, WiFi khách, camera, VLAN và khả năng vận hành liên tục.', body: '' },
  { slug: 'bao-tri-he-thong-mang-doanh-nghiep-dinh-ky', title: 'Checklist bảo trì hệ thống mạng doanh nghiệp định kỳ', description: 'Những việc nên kiểm tra định kỳ để hệ thống mạng ổn định: backup cấu hình, kiểm tra firewall, switch, WiFi, camera, log và tài liệu vận hành.', body: '' },
]

// ── Dữ liệu bảo hành từ app/data.ts ──────────────────────────
const seedWarranty = [
  { code: 'INTECH-2026-0001', serial: 'FGT60F3G26ABC001', customer: 'Công ty TNHH Minh Phát', product: 'Fortinet FortiGate 60F', purchaseDate: '2026-01-12', warrantyUntil: '2027-01-12', status: 'Còn bảo hành', note: 'Bảo hành phần cứng theo chính sách hãng; hỗ trợ kiểm tra cấu hình từ xa.' },
  { code: 'INTECH-2025-0148', serial: 'CBS35024PXYZ148', customer: 'Phòng khám An Bình', product: 'Cisco CBS350-24P-4G', purchaseDate: '2025-08-20', warrantyUntil: '2028-08-20', status: 'Còn bảo hành', note: 'Switch PoE đã bàn giao kèm cấu hình VLAN và file backup.' },
  { code: 'INTECH-2024-0095', serial: 'AP515VN0095', customer: 'Khách sạn Lam River', product: 'Aruba AP-515', purchaseDate: '2024-03-05', warrantyUntil: '2027-03-05', status: 'Còn bảo hành', note: 'Thiết bị thuộc hệ thống WiFi roaming; cần cung cấp vị trí lắp đặt khi yêu cầu hỗ trợ.' },
]

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL chưa được set trong .env')
    process.exit(1)
  }

  const sql = neon(process.env.DATABASE_URL)
  const db = drizzle(sql)

  console.log('🌱 Bắt đầu seed database...\n')

  // ── Tạo tables nếu chưa có ───────────────────────────────
  console.log('📋 Tạo tables...')
  await sql`
    CREATE TABLE IF NOT EXISTS products (
      id            SERIAL PRIMARY KEY,
      slug          TEXT UNIQUE NOT NULL,
      name          TEXT NOT NULL,
      brand         TEXT NOT NULL DEFAULT '',
      category      TEXT NOT NULL DEFAULT '',
      category_slug TEXT NOT NULL DEFAULT '',
      badges        TEXT[] DEFAULT '{}',
      summary       TEXT DEFAULT '',
      specs         TEXT[] DEFAULT '{}',
      applications  TEXT[] DEFAULT '{}',
      image_url     TEXT DEFAULT '',
      datasheet_url TEXT DEFAULT '',
      created_at    TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS posts (
      id           SERIAL PRIMARY KEY,
      slug         TEXT UNIQUE NOT NULL,
      title        TEXT NOT NULL,
      description  TEXT DEFAULT '',
      body         TEXT DEFAULT '',
      published_at TIMESTAMPTZ DEFAULT NOW()
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS services (
      id          SERIAL PRIMARY KEY,
      slug        TEXT UNIQUE NOT NULL,
      title       TEXT NOT NULL,
      description TEXT DEFAULT '',
      keywords    TEXT DEFAULT ''
    )
  `
  await sql`
    CREATE TABLE IF NOT EXISTS warranty (
      id             SERIAL PRIMARY KEY,
      code           TEXT UNIQUE NOT NULL,
      serial         TEXT NOT NULL DEFAULT '',
      customer       TEXT NOT NULL DEFAULT '',
      product        TEXT NOT NULL DEFAULT '',
      purchase_date  TEXT DEFAULT '',
      warranty_until TEXT DEFAULT '',
      status         TEXT DEFAULT 'Còn bảo hành',
      note           TEXT DEFAULT ''
    )
  `
  console.log('✅ Tables đã sẵn sàng\n')

  // ── Seed products từ products-data.ts ─────────────────────
  console.log(`🔧 Đang insert ${productList.length} sản phẩm...`)
  let productCount = 0
  // Insert theo batch 50 để tránh quá tải
  const BATCH = 50
  for (let i = 0; i < productList.length; i += BATCH) {
    const batch = productList.slice(i, i + BATCH).map((p) => ({
      slug:         p.slug,
      name:         p.name,
      brand:        p.brand,
      category:     p.category,
      categorySlug: p.categorySlug,
      badges:       p.badges ?? [],
      summary:      p.summary ?? '',
      specs:        p.specs ?? [],
      applications: p.applications ?? [],
      imageUrl:     p.imageUrl ?? '',
      datasheetUrl: p.datasheetUrl ?? '',
    }))
    await db.insert(products).values(batch).onConflictDoNothing()
    productCount += batch.length
    process.stdout.write(`\r  ${productCount}/${productList.length} sản phẩm...`)
  }
  console.log(`\n✅ ${productCount} sản phẩm đã được import\n`)

  // ── Seed posts ─────────────────────────────────────────────
  console.log('📝 Đang insert bài viết...')
  await db.insert(posts).values(seedPosts).onConflictDoNothing()
  console.log(`✅ ${seedPosts.length} bài viết đã được import\n`)

  // ── Seed warranty ──────────────────────────────────────────
  console.log('🛡️  Đang insert bản ghi bảo hành...')
  await db.insert(warranty).values(seedWarranty).onConflictDoNothing()
  console.log(`✅ ${seedWarranty.length} bản ghi bảo hành đã được import\n`)

  console.log('🎉 Seed hoàn tất! Database đã sẵn sàng.')
  process.exit(0)
}

main().catch((err) => {
  console.error('❌ Seed thất bại:', err)
  process.exit(1)
})
