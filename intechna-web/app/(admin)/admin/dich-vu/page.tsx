import { servicePages, solutionPages } from '@/app/data'
import { ServiceAdminClient } from './ServiceAdminClient'

export default function AdminServicesPage() {
  return (
    <>
      <section className="admin-title"><h1>Quản lý dịch vụ & giải pháp</h1><p>Thêm landing page dịch vụ SEO hoặc giải pháp theo ngành.</p></section>
      <ServiceAdminClient services={servicePages} solutions={solutionPages} />
    </>
  )
}
