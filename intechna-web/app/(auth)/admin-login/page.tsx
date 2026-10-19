import type { Metadata } from 'next'
import AdminLogin from './AdminLogin'
import '../../admin.css'

export const metadata: Metadata = {
  title: 'Đăng nhập quản trị | Intech',
  robots: { index: false, follow: false },
}

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const params = await searchParams
  return (
    <AdminLogin
      initialError={
        params.error === 'forbidden'
          ? 'Tài khoản không có quyền truy cập mục này. Hãy sử dụng tài khoản được cấp quyền.'
          : ''
      }
    />
  )
}
