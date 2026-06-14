import { productList } from '@/app/products-data'
import { ProductAdminClient } from './ProductAdminClient'

export default function AdminProductsPage() {
  return (
    <>
      <section className="admin-title">
        <h1>Quản lý sản phẩm</h1>
        <p>Thêm model, chỉnh hãng, danh mục và mô tả sản phẩm. Catalog hiện có {productList.length} sản phẩm.</p>
      </section>
      <ProductAdminClient products={productList} />
    </>
  )
}
