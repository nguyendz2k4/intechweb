'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { productSlug, wordCount, SUMMARY_MAX_WORDS } from '@/app/lib/product-fields'
import { productCategoryOption } from '@/app/lib/product-categories'
import {
  adminRequest,
  errorMessage,
  safeAssetUrl,
  useAdminPermission,
  type AdminNotice,
} from '../AdminUi'

type AdminProduct = {
  id?: number
  slug: string
  name: string
  brand: string
  category: string
  categorySlug: string
  priceVnd?: number | null
  summary: string | null
  imageUrl: string | null
  datasheetUrl: string | null
  badges?: string[] | null
  specs?: string[] | null
  applications?: string[] | null
  status: 'published' | 'draft'
}
export type ProductDraft = {
  slug: string
  name: string
  brand: string
  category: string
  categorySlug: string
  priceMode: 'price' | 'contact'
  price: string
  summary: string
  imageUrl: string
  datasheetUrl: string
  badges: string
  specs: string
  applications: string
  status: 'published' | 'draft'
}
const initialDraft: ProductDraft = {
  slug: '',
  name: '',
  brand: '',
  category: '',
  categorySlug: '',
  priceMode: 'contact',
  price: '',
  summary: '',
  imageUrl: '',
  datasheetUrl: '',
  badges: '',
  specs: '',
  applications: '',
  status: 'draft',
}
const lines = (value: string) =>
  value
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
const pageSize = 20
type UploadKind = 'image' | 'datasheet'
type UploadFeedback = {
  filename: string
  status: 'uploading' | 'success' | 'error'
  message: string
}

export function useProductAdmin(maxPdfBytes: number) {
  const canWrite = useAdminPermission('products:write')
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [query, setQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [page, setPage] = useState(1)
  const [draft, setDraft] = useState<ProductDraft>(initialDraft)
  const [editingSlug, setEditingSlug] = useState<string | null>(null)
  const [slugCustomized, setSlugCustomized] = useState(false)
  const [editorOpen, setEditorOpen] = useState(false)
  const [notice, setNotice] = useState<AdminNotice>(null)
  const [loading, setLoading] = useState(true)
  const [loadFailed, setLoadFailed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [uploading, setUploading] = useState<'image' | 'datasheet' | null>(null)
  const [uploadFeedback, setUploadFeedback] = useState<Partial<Record<UploadKind, UploadFeedback>>>(
    {},
  )
  const [localImagePreview, setLocalImagePreview] = useState('')
  const uploadInFlight = useRef(false)
  const [pendingDelete, setPendingDelete] = useState<AdminProduct | null>(null)

  useEffect(() => {
    return () => {
      if (localImagePreview) URL.revokeObjectURL(localImagePreview)
    }
  }, [localImagePreview])

  const fetchProducts = useCallback(
    (signal?: AbortSignal) =>
      adminRequest<AdminProduct[]>('/api/admin/products', { signal })
        .then((data) => {
          if (signal?.aborted) return
          if (!Array.isArray(data)) throw new Error('Danh sách sản phẩm không hợp lệ.')
          setProducts(data)
          setNotice(null)
        })
        .catch((error: unknown) => {
          if (signal?.aborted) return
          setLoadFailed(true)
          setNotice({ type: 'error', message: errorMessage(error) })
        })
        .finally(() => {
          if (!signal?.aborted) setLoading(false)
        }),
    [],
  )
  useEffect(() => {
    const controller = new AbortController()
    void fetchProducts(controller.signal)
    return () => controller.abort()
  }, [fetchProducts])

  function loadProducts() {
    setLoading(true)
    setLoadFailed(false)
    return fetchProducts()
  }

  const filtered = useMemo(
    () =>
      products.filter(
        (product) =>
          `${product.name} ${product.brand} ${product.category} ${product.slug}`
            .toLowerCase()
            .includes(query.toLowerCase().trim()) &&
          (filterStatus === 'all' || (product.status ?? 'published') === filterStatus),
      ),
    [products, query, filterStatus],
  )
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, pages)
  const visible = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  function openEditor(product?: AdminProduct) {
    const category = product ? productCategoryOption(product.categorySlug) : undefined
    setEditingSlug(product?.slug ?? null)
    setSlugCustomized(Boolean(product))
    setDraft(
      product
        ? {
            slug: product.slug,
            name: product.name,
            brand: product.brand,
            category: category?.label ?? '',
            categorySlug: category?.slug ?? '',
            priceMode: product.priceVnd ? 'price' : 'contact',
            price: product.priceVnd ? String(product.priceVnd) : '',
            summary: product.summary ?? '',
            imageUrl: product.imageUrl ?? '',
            datasheetUrl: product.datasheetUrl ?? '',
            badges: (product.badges ?? []).join('\n'),
            specs: (product.specs ?? []).join('\n'),
            applications: (product.applications ?? []).join('\n'),
            status: product.status ?? 'published',
          }
        : { ...initialDraft },
    )
    setUploadFeedback({})
    setLocalImagePreview('')
    setNotice(null)
    setEditorOpen(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  function updateIdentity(field: 'name' | 'brand', value: string) {
    setDraft((item) => {
      const next = { ...item, [field]: value }
      return !editingSlug && !slugCustomized
        ? { ...next, slug: productSlug(`${next.brand}-${next.name}`) }
        : next
    })
  }
  async function saveProduct(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy || uploadInFlight.current || !canWrite) return
    if (wordCount(draft.summary) > SUMMARY_MAX_WORDS) {
      setNotice({ type: 'error', message: 'Mô tả ngắn tối đa 1.000 từ.' })
      return
    }
    if (Object.values(uploadFeedback).some((item) => item.status === 'error')) {
      setNotice({
        type: 'error',
        message:
          'Tệp đã chọn chưa tải lên thành công. Hãy thử lại hoặc bỏ tệp đã chọn trước khi lưu.',
      })
      return
    }
    const category = productCategoryOption(draft.categorySlug)
    if (!category) {
      setNotice({ type: 'error', message: 'Vui lòng chọn danh mục sản phẩm.' })
      return
    }
    setBusy(true)
    setNotice(null)
    try {
      const saved = await adminRequest<AdminProduct>('/api/admin/products', {
        method: editingSlug ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...Object.fromEntries(
            Object.entries(draft).filter(([key]) => !['priceMode', 'price'].includes(key)),
          ),
          priceVnd: draft.priceMode === 'price' ? Number(draft.price) : null,
          category: category.label,
          categorySlug: category.slug,
          slug: editingSlug || draft.slug,
          badges: lines(draft.badges),
          specs: lines(draft.specs),
          applications: lines(draft.applications),
        }),
      })
      setProducts((items) => [saved, ...items.filter((item) => item.slug !== saved.slug)])
      setEditorOpen(false)
      setNotice({
        type: 'success',
        message:
          draft.status === 'draft'
            ? 'Đã lưu bản nháp trong cơ sở dữ liệu.'
            : 'Đã lưu và xuất bản sản phẩm.',
      })
    } catch (error) {
      setNotice({ type: 'error', message: errorMessage(error) })
    } finally {
      setBusy(false)
    }
  }
  async function deleteProduct() {
    if (!pendingDelete || busy || !canWrite) return
    setBusy(true)
    try {
      await adminRequest('/api/admin/products', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: pendingDelete.slug }),
      })
      setProducts((items) => items.filter((item) => item.slug !== pendingDelete.slug))
      setPendingDelete(null)
      setNotice({ type: 'success', message: 'Đã xóa sản phẩm khỏi cơ sở dữ liệu.' })
    } catch (error) {
      setNotice({ type: 'error', message: errorMessage(error) })
    } finally {
      setBusy(false)
    }
  }
  async function uploadFile(file: File, kind: UploadKind) {
    if (uploadInFlight.current || busy || !canWrite) return
    if (kind === 'image') setLocalImagePreview('')
    const failUpload = (message: string) => {
      setUploadFeedback((items) => ({
        ...items,
        [kind]: { filename: file.name, status: 'error', message },
      }))
      setNotice({ type: 'error', message })
    }
    const limit = kind === 'image' ? 3 * 1024 * 1024 : maxPdfBytes
    if (file.size > limit) {
      failUpload(
        kind === 'image'
          ? 'Ảnh tối đa 3 MB.'
          : `Datasheet tối đa ${maxPdfBytes / (1024 * 1024)} MB.`,
      )
      return
    }
    if (!file.size) {
      failUpload('Tệp đã chọn trống. Vui lòng chọn tệp khác.')
      return
    }
    uploadInFlight.current = true
    setUploading(kind)
    setUploadFeedback((items) => ({
      ...items,
      [kind]: { filename: file.name, status: 'uploading', message: 'Đang tải lên…' },
    }))
    if (kind === 'image' && /^image\/(jpeg|png|webp|gif)$/i.test(file.type))
      setLocalImagePreview(URL.createObjectURL(file))
    setNotice(null)
    try {
      const form = new FormData()
      form.append('file', file)
      form.append('kind', kind)
      const data = await adminRequest<{ url: string }>('/api/admin/uploads', {
        method: 'POST',
        body: form,
      })
      if (typeof data?.url !== 'string' || !safeAssetUrl(data.url))
        throw new Error('Máy chủ chưa trả về đường dẫn tệp. Vui lòng tải lại.')
      setDraft((item) =>
        kind === 'image' ? { ...item, imageUrl: data.url } : { ...item, datasheetUrl: data.url },
      )
      setUploadFeedback((items) => ({
        ...items,
        [kind]: {
          filename: file.name,
          status: 'success',
          message: 'Đã tải lên. Lưu sản phẩm để ghi lại thay đổi.',
        },
      }))
      if (kind === 'image') setLocalImagePreview('')
      setNotice({ type: 'success', message: 'Đã tải tệp lên. Lưu sản phẩm để ghi lại thay đổi.' })
    } catch (error) {
      failUpload(errorMessage(error))
    } finally {
      uploadInFlight.current = false
      setUploading(null)
    }
  }

  function closeEditor() {
    if (uploadInFlight.current) return
    setEditorOpen(false)
    setLocalImagePreview('')
    setNotice(null)
  }
  function updateDraft<K extends keyof ProductDraft>(field: K, value: ProductDraft[K]) {
    setDraft((item) => ({ ...item, [field]: value }))
  }
  function updateSlug(slug: string) {
    const normalized = productSlug(slug)
    setSlugCustomized(Boolean(normalized))
    updateDraft('slug', normalized || productSlug(`${draft.brand}-${draft.name}`))
  }
  function updateCategory(slug: string) {
    const category = productCategoryOption(slug)
    setDraft((item) => ({
      ...item,
      category: category?.label ?? '',
      categorySlug: category?.slug ?? '',
    }))
  }
  function discardUpload(kind: UploadKind) {
    if (uploadInFlight.current) return
    setUploadFeedback((items) => {
      const next = { ...items }
      delete next[kind]
      return next
    })
    if (kind === 'image') setLocalImagePreview('')
    setNotice(null)
  }
  function changeQuery(value: string) {
    setQuery(value)
    setPage(1)
  }
  function changeFilterStatus(value: string) {
    setFilterStatus(value)
    setPage(1)
  }
  function requestDelete(product: AdminProduct) {
    setPendingDelete(product)
    setNotice(null)
  }
  function cancelDelete() {
    setPendingDelete(null)
  }

  return {
    canWrite,
    draft,
    editingSlug,
    editorOpen,
    notice,
    loading,
    loadFailed,
    busy,
    uploading,
    uploadFeedback,
    localImagePreview,
    maxPdfBytes,
    pendingDelete,
    query,
    filterStatus,
    currentPage,
    pages,
    pageSize,
    visible,
    productCount: products.length,
    filteredCount: filtered.length,
    openEditor,
    closeEditor,
    updateDraft,
    updateSlug,
    updateIdentity,
    updateCategory,
    saveProduct,
    deleteProduct,
    uploadFile,
    discardUpload,
    loadProducts,
    changeQuery,
    changeFilterStatus,
    setPage,
    requestDelete,
    cancelDelete,
  }
}

export type ProductAdminState = ReturnType<typeof useProductAdmin>
