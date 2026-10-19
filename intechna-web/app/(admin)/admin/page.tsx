import Link from 'next/link'
import { getAdminCounts } from '@/app/lib/db/queries'
import { requireAdminPage } from '@/app/lib/admin-auth-page'

const sections = [
  {
    key: 'products',
    label: 'Sản phẩm',
    href: '/admin/san-pham',
    description: 'Thông tin thiết bị, ảnh và datasheet.',
  },
  {
    key: 'posts',
    label: 'Bài viết',
    href: '/admin/noi-dung',
    description: 'Bài viết đã xuất bản và bản nháp.',
  },
  {
    key: 'services',
    label: 'Dịch vụ',
    href: '/admin/dich-vu',
    description: 'Nội dung dịch vụ lưu trong CMS.',
  },
  {
    key: 'warranty',
    label: 'Hồ sơ bảo hành',
    href: '/admin/bao-hanh',
    description: 'Thiết bị và bảo hành đã kích hoạt.',
  },
  {
    key: 'contacts',
    label: 'Yêu cầu liên hệ',
    href: '/admin/lien-he',
    description: 'Yêu cầu từ khách hàng cần tiếp nhận.',
  },
] as const

export default async function AdminPage() {
  const session = await requireAdminPage()
  let counts: Record<string, number> = {}
  let failed = false
  try {
    counts = await getAdminCounts(session.permissions)
  } catch {
    failed = true
  }

  return (
    <>
      <section className="admin-title">
        <p className="admin-eyebrow">Không gian quản trị</p>
        <h1>Tổng quan website</h1>
        <p>
          Quản lý nội dung và yêu cầu khách hàng từ một nơi. Số liệu bên dưới lấy trực tiếp từ cơ sở
          dữ liệu theo quyền của tài khoản.
        </p>
      </section>
      {failed && (
        <p className="admin-note error" role="alert">
          Không tải được số liệu từ cơ sở dữ liệu. Kiểm tra kết nối và cấu hình database, sau đó tải
          lại trang.
        </p>
      )}
      <section className="admin-grid" aria-label="Số liệu CMS">
        {sections
          .filter((item) =>
            session.permissions.some((permission) => permission === `${item.key}:read`),
          )
          .map((item) => (
            <article className="admin-card" key={item.key}>
              <h2>{item.label}</h2>
              <span className="admin-stat">
                {failed ? '—' : (counts[item.key]?.toLocaleString('vi-VN') ?? '—')}
              </span>
              <p>{item.description}</p>
              <Link className="admin-stat-link" href={item.href}>
                Mở quản lý <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}
      </section>
      <p className="admin-note admin-dashboard-note">
        CMS cập nhật nội dung trong mẫu giao diện hiện tại. Số lượng sản phẩm và bài viết bao gồm cả
        bản nháp trong cơ sở dữ liệu.
      </p>
    </>
  )
}
