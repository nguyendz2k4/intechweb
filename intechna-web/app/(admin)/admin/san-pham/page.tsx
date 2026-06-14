import { ProductAdminClient } from './ProductAdminClient'

export default function AdminProductsPage() {
  return (
    <>
      <section className="admin-title">
        <h1>Quản lý sản phẩm</h1>
        <p>Thêm, sửa, xóa sản phẩm trong catalog. Dữ liệu lưu trực tiếp vào database.</p>
      </section>
      <ProductAdminClient />
    </>
  )
}
