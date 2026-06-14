'use client'

import { useEffect, useMemo, useState } from 'react'
import type { Product } from '@/app/products-data'

type DraftProduct = { name: string; brand: string; category: string; categorySlug: string; summary: string; imageUrl: string; datasheetUrl: string; slug?: string }
const initialDraft: DraftProduct = { name: '', brand: '', category: 'Switch', categorySlug: 'switch', summary: '', imageUrl: '', datasheetUrl: '' }

export function ProductAdminClient({ products }: { products: Product[] }) {
  const [query, setQuery] = useState('')
  const [draft, setDraft] = useState<DraftProduct>(initialDraft)
  const [saved, setSaved] = useState<Product[]>([])
  const [status, setStatus] = useState('')
  useEffect(() => { fetch('/api/admin/products').then((res) => res.json()).then(setSaved).catch(() => setStatus('Không tải được sản phẩm đã lưu')) }, [])
  const allProducts = [...saved, ...products]
  const filtered = useMemo(() => allProducts.filter((product) => `${product.name} ${product.brand} ${product.category}`.toLowerCase().includes(query.toLowerCase())).slice(0, 100), [allProducts, query])

  async function saveProduct() {
    if (!draft.name || !draft.brand) return
    setStatus('Đang lưu...')
    const res = await fetch('/api/admin/products', { method: draft.slug ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(draft) })
    if (!res.ok) { setStatus('Lưu thất bại'); return }
    const product = await res.json()
    setSaved((items) => [product, ...items.filter((item) => item.slug !== product.slug)])
    setDraft(initialDraft)
    setStatus('Đã lưu thật vào data/admin-products.json')
  }

  async function deleteProduct(slug: string) {
    if (!confirm('Xóa sản phẩm đã thêm từ admin?')) return
    await fetch('/api/admin/products', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug }) })
    setSaved((items) => items.filter((item) => item.slug !== slug))
    setStatus('Đã xóa sản phẩm')
  }

  async function uploadFile(file: File, kind: 'image' | 'datasheet') {
    setStatus('Đang upload file...')
    const form = new FormData()
    form.append('file', file)
    form.append('kind', kind)
    const res = await fetch('/api/admin/uploads', { method: 'POST', body: form })
    if (!res.ok) { setStatus(kind === 'image' ? 'Upload ảnh thất bại' : 'Upload datasheet thất bại'); return }
    const data = await res.json()
    setDraft((item) => kind === 'image' ? { ...item, imageUrl: data.url } : { ...item, datasheetUrl: data.url })
    setStatus('Đã upload file')
  }

  function editProduct(product: Product) {
    setDraft({ slug: product.slug, name: product.name, brand: product.brand, category: product.category, categorySlug: product.categorySlug, summary: product.summary, imageUrl: product.imageUrl || '', datasheetUrl: product.datasheetUrl || '' })
  }

  return (
    <div className="admin-split">
      <section className="admin-card">
        <h2>{draft.slug ? 'Sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
        <p>Sản phẩm lưu thật vào file <strong>data/admin-products.json</strong>. Có thể upload ảnh sản phẩm và datasheet PDF để khách tải về.</p>
        <div className="admin-form">
          <label><span>Tên/model</span><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="VD: Fortinet FortiGate 100F" /></label>
          <label><span>Hãng</span><input value={draft.brand} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} placeholder="VD: Fortinet" /></label>
          <label><span>Danh mục</span><input value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} placeholder="VD: Firewall" /></label>
          <label><span>Slug danh mục</span><select value={draft.categorySlug} onChange={(e) => setDraft({ ...draft, categorySlug: e.target.value })}><option value="switch">Switch</option><option value="wifi-access-point">WiFi Access Point</option><option value="router">Router</option><option value="firewall">Firewall</option><option value="module-quang-phu-kien">Module quang/phụ kiện</option><option value="nas-luu-tru">NAS/lưu trữ</option></select></label>
          <label><span>Upload ảnh sản phẩm</span><input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadFile(file, 'image') }} /></label>
          <label><span>Link hình ảnh</span><input value={draft.imageUrl} onChange={(e) => setDraft({ ...draft, imageUrl: e.target.value })} placeholder="https://... hoặc /uploads/images/..." /></label>
          {draft.imageUrl && <img className="admin-image-preview" src={draft.imageUrl} alt="Xem trước ảnh" />}
          <label><span>Upload datasheet PDF</span><input type="file" accept="application/pdf" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadFile(file, 'datasheet') }} /></label>
          <label><span>Link datasheet</span><input value={draft.datasheetUrl} onChange={(e) => setDraft({ ...draft, datasheetUrl: e.target.value })} placeholder="https://... hoặc /uploads/datasheets/...pdf" /></label>
          {draft.datasheetUrl && <p className="admin-note">Datasheet: <a href={draft.datasheetUrl} target="_blank">Mở file PDF</a></p>}
          <label><span>Mô tả ngắn</span><textarea value={draft.summary} onChange={(e) => setDraft({ ...draft, summary: e.target.value })} placeholder="Mô tả viết lại theo Intech" /></label>
          <button className="admin-btn primary" type="button" onClick={saveProduct}>{draft.slug ? 'Cập nhật sản phẩm' : 'Lưu sản phẩm'}</button>
          {draft.slug && <button className="admin-btn" type="button" onClick={() => setDraft(initialDraft)}>Hủy sửa</button>}
          {status && <p className="admin-note">{status}</p>}
        </div>
      </section>
      <section className="admin-card">
        <h2>Catalog hiện có</h2>
        <div className="admin-form"><label><span>Tìm nhanh</span><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm model/hãng/danh mục" /></label></div>
        <table className="admin-table"><thead><tr><th>Model</th><th>Hãng</th><th>Danh mục</th></tr></thead><tbody>{filtered.map((product) => <tr key={product.slug}><td>{product.name}</td><td>{product.brand}</td><td>{product.category}</td></tr>)}</tbody></table>
      </section>
      <section className="admin-card" style={{ gridColumn: '1 / -1' }}>
        <h2>Sản phẩm đã lưu từ admin</h2>
        <div className="preview-box">{saved.length === 0 ? <p>Chưa có sản phẩm admin.</p> : saved.map((item) => <div className="preview-item" key={item.slug}>{item.imageUrl && <img className="admin-thumb" src={item.imageUrl} alt={item.name} />}<strong>{item.name}</strong><small>{item.brand} / {item.category}</small><p>{item.summary}</p>{item.datasheetUrl && <a href={item.datasheetUrl} target="_blank">Tải datasheet</a>}<div className="admin-actions"><button className="admin-btn" onClick={() => editProduct(item)}>Sửa</button><button className="admin-btn" onClick={() => deleteProduct(item.slug)}>Xóa</button></div></div>)}</div>
      </section>
    </div>
  )
}
