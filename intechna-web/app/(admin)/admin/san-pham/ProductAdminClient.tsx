'use client'

import { ProductEditor } from './ProductEditor'
import { ProductTable } from './ProductTable'
import { useProductAdmin } from './use-product-admin'

export function ProductAdminClient({ maxPdfBytes }: { maxPdfBytes: number }) {
  const admin = useProductAdmin(maxPdfBytes)
  return admin.editorOpen ? <ProductEditor {...admin} /> : <ProductTable {...admin} />
}
