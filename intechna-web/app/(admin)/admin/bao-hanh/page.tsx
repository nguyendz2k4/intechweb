import { WarrantyAdminClient } from './WarrantyAdminClient'

export default function AdminWarrantyPage() {
  return (
    <>
      <section className="admin-title">
        <h1>Kích hoạt bảo hành</h1>
        <p>Nhập thông tin thiết bị và khách hàng để kích hoạt bảo hành mới. Lưu ý: Sau khi đã kích hoạt, thông tin bảo hành không thể chỉnh sửa hoặc xóa vì lý do bảo mật dữ liệu.</p>
      </section>
      <WarrantyAdminClient />
    </>
  )
}
