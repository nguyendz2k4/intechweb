import Link from 'next/link'


const adminNav = [
  ['Dashboard', '/admin'],
  ['Sản phẩm', '/admin/san-pham'],
  ['Nội dung', '/admin/noi-dung'],
  ['Dịch vụ', '/admin/dich-vu'],
  ['Xem website', '/'],
] as const

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="admin-shell">
      <header className="admin-header">
        <Link className="admin-brand" href="/admin">
          <span className="admin-mark">I</span>
          <span><strong>INTECH ADMIN</strong><br /><small>Quản trị nội dung website</small></span>
        </Link>
        <nav>{adminNav.map(([label, href]) => <Link key={href} href={href}>{label}</Link>)}</nav>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  )
}
