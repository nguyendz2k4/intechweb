import { requireAdminPage } from '@/app/lib/admin-auth-page'
import { ContactAdminClient } from './ContactAdminClient'

export default async function AdminContactsPage() {
  await requireAdminPage('contacts:read')
  return (
    <>
      <section className="admin-title">
        <p className="admin-eyebrow">Chăm sóc khách hàng</p>
        <h1>Yêu cầu liên hệ</h1>
        <p>Tiếp nhận thông tin khách hàng và theo dõi tiến độ xử lý yêu cầu.</p>
      </section>
      <ContactAdminClient />
    </>
  )
}
