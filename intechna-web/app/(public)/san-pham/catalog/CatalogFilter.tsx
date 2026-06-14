'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import type { Product } from '@/app/products-data'

function unique(values: string[]) {
  return Array.from(new Set(values)).sort()
}

export function CatalogFilter({ products }: { products: Product[] }) {
  const [adminProducts, setAdminProducts] = useState<Product[]>([])
  const allProducts = useMemo(() => [...adminProducts, ...products], [adminProducts, products])
  const brands = useMemo(() => unique(allProducts.map((product) => product.brand)), [allProducts])
  const categories = useMemo(() => unique(allProducts.map((product) => product.categorySlug)), [allProducts])
  const [query, setQuery] = useState('')
  const [brand, setBrand] = useState('all')
  const [category, setCategory] = useState('all')

  useEffect(() => { fetch('/api/admin/products').then((res) => res.json()).then(setAdminProducts).catch(() => setAdminProducts([])) }, [])

  const filtered = allProducts.filter((product) => {
    const q = query.trim().toLowerCase()
    const matchQuery = !q || `${product.name} ${product.brand} ${product.category} ${product.summary}`.toLowerCase().includes(q)
    const matchBrand = brand === 'all' || product.brand === brand
    const matchCategory = category === 'all' || product.categorySlug === category
    return matchQuery && matchBrand && matchCategory
  })

  return (
    <>
      <div className="filter-panel">
        <label><span>Tìm model / hãng</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Ví dụ: FortiGate 100F, Cisco C9300, Aruba AP..." /></label>
        <label><span>Hãng</span><select value={brand} onChange={(event) => setBrand(event.target.value)}><option value="all">Tất cả hãng</option>{brands.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
        <label><span>Danh mục</span><select value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Tất cả danh mục</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></label>
      </div>
      <div className="catalog-summary"><strong>{filtered.length}</strong> / {allProducts.length} sản phẩm phù hợp{(query || brand !== 'all' || category !== 'all') && <button type="button" onClick={() => { setQuery(''); setBrand('all'); setCategory('all') }}>Xóa lọc</button>}</div>
      <div className="product-scroll-panel" aria-label="Danh sách sản phẩm có thể cuộn">
        <div className="cards product-scroll-grid">
          {filtered.map((product) => (
            <article className="card product-card" key={product.slug}>
              {product.imageUrl ? <img className="product-thumb" src={product.imageUrl} alt={product.name} /> : <div className="product-thumb placeholder"><span>{product.brand.slice(0, 2).toUpperCase()}</span></div>}
              <p className="eyebrow">{product.brand} / {product.category}</p>
              <h2>{product.name}</h2>
              <p>{product.summary}</p>
              <ul className="mini-list">{product.badges.map((badge) => <li key={badge}>{badge}</li>)}</ul>
              <div className="actions"><Link className="btn secondary" href={`/san-pham/catalog/${product.slug}`}>Xem chi tiết</Link>{product.datasheetUrl && <a className="btn secondary" href={product.datasheetUrl} target="_blank" rel="noopener noreferrer">Tải datasheet</a>}</div>
            </article>
          ))}
        </div>
      </div>
    </>
  )
}
