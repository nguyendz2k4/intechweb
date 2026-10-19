import { WarrantyAdminClient } from './WarrantyAdminClient'
import { requireAdminPage } from '@/app/lib/admin-auth-page'

export default async function AdminWarrantyPage() {
  await requireAdminPage('warranty:read')
  return (
    <>
      <section className="admin-title">
        <p className="admin-eyebrow">Chăm sóc khách hàng</p>
        <h1>Bảo hành</h1>
        <p>
          Thêm, chỉnh sửa và tra cứu hồ sơ bảo hành của thiết bị, bao gồm sản phẩm đã mua từ năm
          2024. Ngày mua và ngày hết hạn được lưu theo hồ sơ thực tế.
        </p>
      </section>
      <WarrantyAdminClient />
    </>
  )
}
