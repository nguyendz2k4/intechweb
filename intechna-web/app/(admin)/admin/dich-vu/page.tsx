import { servicePages, solutionPages } from '@/app/data'
import { ServiceAdminClient } from './ServiceAdminClient'
import { requireAdminPage } from '@/app/lib/admin-auth-page'

export default async function AdminServicesPage() {
  await requireAdminPage('services:read')
  return (
    <>
      <section className="admin-title">
        <p className="admin-eyebrow">Nội dung website</p>
        <h1>Dịch vụ và giải pháp</h1>
        <p>Quản lý nội dung dịch vụ trong CMS và tham khảo các trang hiện có của website.</p>
      </section>
      <ServiceAdminClient services={servicePages} solutions={solutionPages} />
    </>
  )
}
