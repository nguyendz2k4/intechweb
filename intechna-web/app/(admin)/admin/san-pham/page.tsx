import { ProductAdminClient } from './ProductAdminClient'
import { requireAdminPage } from '@/app/lib/admin-auth-page'
import { MAX_BLOB_FILE_BYTES, MAX_PDF_BYTES } from '@/app/lib/upload-security'

export default async function AdminProductsPage() {
  await requireAdminPage('products:read')
  return (
    <>
      <section className="admin-title">
        <p className="admin-eyebrow">Nội dung website</p>
        <h1>Sản phẩm</h1>
        <p>
          Quản lý thông tin, ảnh và tài liệu của catalog. Mẫu trình bày sản phẩm trên website được
          giữ cố định.
        </p>
      </section>
      <ProductAdminClient
        maxPdfBytes={
          process.env.UPLOAD_STORAGE === 'vercel-blob' ? MAX_BLOB_FILE_BYTES : MAX_PDF_BYTES
        }
      />
    </>
  )
}
