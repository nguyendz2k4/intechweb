'use client'

import { productPriceLabel } from '@/app/lib/product-fields'

import Link from 'next/link'
import { useMemo } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import type { Product } from '@/app/lib/catalog-types'
import { ProductPlaceholder } from '@/app/ProductPlaceholder'
import { ProductImage } from './ProductImage'
import {
  catalogCategoryName,
  catalogProductPath,
  catalogSlug,
  catalogView,
  productKeySpecs,
} from '@/app/catalog-utils'

export function CatalogFilter({
  products,
  initialSearch = '',
  fixedBrand,
  fixedCategory,
  productHeading = 'h2',
}: {
  products: Product[]
  initialSearch?: string
  fixedBrand?: string
  fixedCategory?: string
  productHeading?: 'h2' | 'h3'
}) {
  const ProductHeading = productHeading
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = new URLSearchParams(searchParams?.toString() ?? initialSearch)
  const query = search.get('q') ?? ''
  const brand = catalogSlug(search.get('brand') ?? '')
  const category = search.get('category') ?? ''
  const brands = useMemo(
    () => Array.from(new Set(products.map((product) => product.brand))).sort(),
    [products],
  )
  const categories = useMemo(
    () => Array.from(new Set(products.map((product) => product.categorySlug))).sort(),
    [products],
  )
  const { filtered, totalPages, page, visible } = catalogView(
    products,
    search,
    fixedBrand,
    fixedCategory,
  )
  const hasFilters = Boolean(query || (!fixedBrand && brand) || (!fixedCategory && category))

  function updateFilter(key: string, value: string) {
    const next = new URLSearchParams(window.location.search)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    const suffix = next.toString()
    // Next integrates native history with search params and Back/Forward.
    // The catalog does not need another server request on every keystroke.
    const url = `${pathname}${suffix ? `?${suffix}` : ''}`
    if (key === 'q') window.history.replaceState(null, '', url)
    else window.history.pushState(null, '', url)
  }

  function clearFilters() {
    const next = new URLSearchParams(window.location.search)
    for (const key of ['q', 'brand', 'category', 'page']) next.delete(key)
    const suffix = next.toString()
    window.history.pushState(null, '', `${pathname}${suffix ? `?${suffix}` : ''}`)
  }

  function pageHref(nextPage: number) {
    const next = new URLSearchParams(search)
    if (nextPage === 1) next.delete('page')
    else next.set('page', String(nextPage))
    const suffix = next.toString()
    return `${pathname}${suffix ? `?${suffix}` : ''}`
  }

  return (
    <div className="catalog-browser">
      <aside className="catalog-filter-rail" aria-label="Bộ lọc thiết bị">
        <form
          className="catalog-filter-form"
          action={pathname}
          method="get"
          onSubmit={(event) => event.preventDefault()}
        >
          <div className="catalog-filter-heading">
            <h2>Tìm thiết bị</h2>
            {hasFilters && (
              <button type="button" onClick={clearFilters}>
                Xóa lọc
              </button>
            )}
          </div>
          <label htmlFor="catalog-query">Model hoặc từ khóa</label>
          <div className="catalog-search-field">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="10.5" cy="10.5" r="6.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="m16 16 5 5" stroke="currentColor" strokeWidth="1.5" />
            </svg>
            <input
              id="catalog-query"
              type="search"
              name="q"
              maxLength={120}
              value={query}
              onChange={(event) => updateFilter('q', event.target.value)}
              placeholder="VD: CBS350, FortiGate…"
              autoComplete="off"
            />
          </div>
          {!fixedBrand && (
            <>
              <label htmlFor="catalog-brand">Thương hiệu</label>
              <select
                id="catalog-brand"
                name="brand"
                value={brand}
                onChange={(event) => updateFilter('brand', event.target.value)}
              >
                <option value="">Tất cả thương hiệu</option>
                {brands.map((item) => (
                  <option key={item} value={catalogSlug(item)}>
                    {item}
                  </option>
                ))}
              </select>
            </>
          )}
          {!fixedCategory && (
            <>
              <label htmlFor="catalog-category">Loại thiết bị</label>
              <select
                id="catalog-category"
                name="category"
                value={category}
                onChange={(event) => updateFilter('category', event.target.value)}
              >
                <option value="">Tất cả thiết bị</option>
                {categories.map((item) => (
                  <option key={item} value={item}>
                    {catalogCategoryName(item, products)}
                  </option>
                ))}
              </select>
            </>
          )}
          <noscript>
            <button className="btn primary" type="submit">
              Áp dụng bộ lọc
            </button>
          </noscript>
        </form>
        <div className="catalog-filter-help">
          <p>Cần chọn cấu hình?</p>
          <span>
            Gửi số lượng người dùng, sơ đồ mạng và ngân sách. Intech sẽ giúp bạn chọn thiết bị phù
            hợp.
          </span>
          <Link href="/lien-he" className="catalog-text-link">
            Tư vấn cùng kỹ sư <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </aside>
      <div className="catalog-results">
        <div className="catalog-result-bar">
          <p role="status" aria-live="polite">
            <strong>{filtered.length}</strong> thiết bị{hasFilters ? ' phù hợp' : ' trong catalog'}
          </p>
          <span>Thông số & cấu hình tham khảo</span>
        </div>
        {visible.length === 0 ? (
          <div className="catalog-empty">
            <span aria-hidden="true">⌕</span>
            <h2>
              {products.length ? 'Chưa tìm thấy thiết bị phù hợp.' : 'Catalog đang được cập nhật.'}
            </h2>
            <p>
              {products.length
                ? 'Thử từ khóa ngắn hơn hoặc chọn một thương hiệu, loại thiết bị khác.'
                : 'Liên hệ Intech để được tư vấn model và cấu hình cho dự án của bạn.'}
            </p>
            {hasFilters && (
              <button className="btn secondary" type="button" onClick={clearFilters}>
                Xóa bộ lọc
              </button>
            )}
            <Link className="catalog-text-link" href="/lien-he">
              Yêu cầu tư vấn <span aria-hidden="true">↗</span>
            </Link>
          </div>
        ) : (
          <div className="catalog-product-grid">
            {visible.map((product) => (
              <article className="catalog-product-card" key={product.slug}>
                <Link
                  className="catalog-product-visual"
                  href={catalogProductPath(product.slug)}
                  tabIndex={-1}
                  aria-hidden="true"
                >
                  {product.imageUrl ? (
                    <ProductImage
                      src={product.imageUrl}
                      alt=""
                      width={480}
                      height={280}
                      sizes="(max-width: 520px) 88vw, (max-width: 800px) 42vw, (max-width: 1100px) 32vw, 280px"
                      fallback={
                        <ProductPlaceholder
                          brand={product.brand}
                          categorySlug={product.categorySlug}
                          name={product.name}
                        />
                      }
                    />
                  ) : (
                    <ProductPlaceholder
                      brand={product.brand}
                      categorySlug={product.categorySlug}
                      name={product.name}
                    />
                  )}
                </Link>
                <div className="catalog-product-copy">
                  <p className="catalog-product-brand">
                    {product.brand}{' '}
                    <span>· {catalogCategoryName(product.categorySlug, products)}</span>
                  </p>
                  <ProductHeading>
                    <Link href={catalogProductPath(product.slug)}>{product.name}</Link>
                  </ProductHeading>
                  <div className="catalog-badges">
                    {product.badges.slice(0, 3).map((badge) => (
                      <span key={badge}>{badge}</span>
                    ))}
                  </div>
                  <ul className="catalog-key-specs">
                    {productKeySpecs(product).map((spec) => (
                      <li key={spec}>{spec}</li>
                    ))}
                  </ul>
                  <div className="catalog-price-row">
                    <strong>{productPriceLabel(product.priceVnd)}</strong>
                    <Link className="catalog-text-link" href="/lien-he">
                      Liên hệ ↗
                    </Link>
                  </div>
                  <div className="catalog-card-actions">
                    <Link className="catalog-text-link" href={catalogProductPath(product.slug)}>
                      Chi tiết model <span aria-hidden="true">↗</span>
                    </Link>
                    {product.datasheetUrl && (
                      <a
                        href={product.datasheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`Mở datasheet ${product.name}, tab mới`}
                      >
                        Datasheet <span aria-hidden="true">↓</span>
                      </a>
                    )}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
        {totalPages > 1 && (
          <nav className="catalog-pagination" aria-label="Phân trang catalog">
            {page > 1 ? (
              <Link href={pageHref(page - 1)} scroll={false}>
                ← Trang trước
              </Link>
            ) : (
              <span />
            )}
            <span>
              Trang <strong>{page}</strong> / {totalPages}
            </span>
            {page < totalPages ? (
              <Link href={pageHref(page + 1)} scroll={false}>
                Trang sau →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </div>
    </div>
  )
}
