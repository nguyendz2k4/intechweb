import Link from 'next/link'
import { posts, servicePages, solutionPages } from '@/app/data'
import { productList } from '@/app/products-data'
import { getWarrantyRecords } from '@/app/lib/db/queries'

export default async function AdminPage() {
  let warrantyCount = 0
  try {
    const w = await getWarrantyRecords()
    warrantyCount = w.length
  } catch {
    // Fallback if DB is down or connection not ready
  }

  const stats = [
    { label: 'Sản phẩm catalog', value: productList.length, href: '/admin/san-pham' },
    { label: 'Bài viết', value: posts.length, href: '/admin/noi-dung' },
    { label: 'Kích hoạt bảo hành', value: warrantyCount, href: '/admin/bao-hanh' },
    { label: 'Landing page dịch vụ', value: servicePages.length, href: '/admin/dich-vu' },
    { label: 'Trang giải pháp', value: solutionPages.length, href: '/admin/dich-vu' },
  ]

  return (
    <>
      <section className="admin-title">
        <h1>Dashboard quản trị Intech</h1>
        <p>Trang nội bộ để quản lý sản phẩm, bài viết, dịch vụ và giải pháp. Bản hiện tại là giao diện quản trị + nhập liệu nháp; bước tiếp theo có thể nối database/API để lưu thật.</p>
      </section>
      <section className="admin-grid">
        {stats.map((item) => <article className="admin-card" key={item.label}><span className="admin-pill">{item.label}</span><h2>{item.value}</h2><p>Quản lý và chuẩn hóa dữ liệu {item.label.toLowerCase()}.</p><div className="admin-actions"><Link className="admin-btn primary" href={item.href}>Mở quản lý</Link></div></article>)}
      </section>
    </>
  )
}
