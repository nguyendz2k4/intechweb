import { requireAdminPage } from '@/app/lib/admin-auth-page'
import { AccountSecurity } from './AccountSecurity'

export default async function AccountPage() {
  await requireAdminPage()
  return (
    <>
      <section className="admin-title">
        <p className="admin-eyebrow">Tài khoản</p>
        <h1>Bảo mật đăng nhập</h1>
        <p>Quản lý mật khẩu, xác thực hai bước và phiên đăng nhập của bạn.</p>
      </section>
      <AccountSecurity />
    </>
  )
}
