'use client'

import {
  Notice,
  LoadingRows,
  EmptyState,
  DeleteConfirmation,
  safeAssetUrl,
  publicPageUrl,
} from '../AdminUi'
import type { ProductAdminState } from './use-product-admin'

type ProductTableProps = Pick<
  ProductAdminState,
  | 'canWrite'
  | 'loading'
  | 'loadFailed'
  | 'busy'
  | 'productCount'
  | 'filteredCount'
  | 'notice'
  | 'pendingDelete'
  | 'query'
  | 'filterStatus'
  | 'visible'
  | 'currentPage'
  | 'pages'
  | 'pageSize'
  | 'openEditor'
  | 'cancelDelete'
  | 'deleteProduct'
  | 'changeQuery'
  | 'changeFilterStatus'
  | 'loadProducts'
  | 'requestDelete'
  | 'setPage'
>

export function ProductTable({
  canWrite,
  loading,
  loadFailed,
  busy,
  productCount,
  filteredCount,
  notice,
  pendingDelete,
  query,
  filterStatus,
  visible,
  currentPage,
  pages,
  pageSize,
  openEditor,
  cancelDelete,
  deleteProduct,
  changeQuery,
  changeFilterStatus,
  loadProducts,
  requestDelete,
  setPage,
}: ProductTableProps) {
  return (
    <section className="admin-card">
      <div className="admin-list-heading">
        <div>
          <h2>Danh sách sản phẩm</h2>
          <p>
            {loading
              ? 'Đang tải cơ sở dữ liệu…'
              : loadFailed
                ? 'Chưa tải được dữ liệu'
                : `${productCount} sản phẩm trong cơ sở dữ liệu`}
          </p>
        </div>
        {canWrite && (
          <button
            className="admin-btn primary"
            disabled={loading || loadFailed || busy}
            onClick={() => openEditor()}
          >
            + Thêm sản phẩm
          </button>
        )}
      </div>
      <Notice notice={notice} />
      {pendingDelete && (
        <DeleteConfirmation
          name={pendingDelete.name}
          busy={busy}
          onCancel={cancelDelete}
          onConfirm={() => void deleteProduct()}
        />
      )}
      <div className="admin-toolbar">
        <div className="admin-form">
          <label>
            <span>Tìm sản phẩm</span>
            <input
              type="search"
              value={query}
              onChange={(event) => changeQuery(event.target.value)}
              placeholder="Model, thương hiệu, danh mục…"
            />
          </label>
        </div>
        <div className="admin-form">
          <label>
            <span>Trạng thái</span>
            <select
              value={filterStatus}
              onChange={(event) => changeFilterStatus(event.target.value)}
            >
              <option value="all">Tất cả</option>
              <option value="published">Đã xuất bản</option>
              <option value="draft">Bản nháp</option>
            </select>
          </label>
        </div>
      </div>
      {loading ? (
        <LoadingRows />
      ) : loadFailed ? (
        <button className="admin-btn" onClick={() => void loadProducts()}>
          Tải lại danh sách
        </button>
      ) : filteredCount === 0 ? (
        <EmptyState
          title={productCount ? 'Không tìm thấy sản phẩm' : 'Chưa có sản phẩm trong CMS'}
          text={
            productCount
              ? 'Thử từ khóa hoặc trạng thái khác.'
              : 'Thêm sản phẩm để bắt đầu quản lý nội dung từ cơ sở dữ liệu.'
          }
        />
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => (
                  <tr key={product.slug}>
                    <td>
                      <div className="admin-product-cell">
                        {safeAssetUrl(product.imageUrl) && (
                          // eslint-disable-next-line @next/next/no-img-element -- CMS previews use original asset URLs and intrinsic dimensions without image optimization.
                          <img
                            className="admin-thumb"
                            src={safeAssetUrl(product.imageUrl)}
                            alt={product.name}
                          />
                        )}
                        <div>
                          <strong>{product.name}</strong>
                          <small>
                            {product.brand} · {product.slug}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td>
                      <span className={`admin-pill ${product.status === 'draft' ? 'draft' : ''}`}>
                        {product.status === 'draft' ? 'Bản nháp' : 'Đã xuất bản'}
                      </span>
                    </td>
                    <td>
                      <div className="admin-actions">
                        {canWrite && (
                          <>
                            <button
                              className="admin-btn compact"
                              disabled={busy}
                              onClick={() => openEditor(product)}
                            >
                              Sửa
                            </button>
                            <button
                              className="admin-btn compact danger"
                              disabled={busy}
                              onClick={() => requestDelete(product)}
                            >
                              Xóa
                            </button>
                          </>
                        )}
                        {product.status !== 'draft' && (
                          <a
                            href={publicPageUrl(
                              `/san-pham/catalog/${encodeURIComponent(product.slug)}`,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            aria-label={`Xem ${product.name}`}
                          >
                            Xem ↗
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-list-heading">
            <p className="admin-count">
              {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredCount)} /{' '}
              {filteredCount} sản phẩm
            </p>
            <div className="admin-actions">
              <button
                className="admin-btn compact"
                disabled={currentPage <= 1}
                onClick={() => setPage(currentPage - 1)}
              >
                Trước
              </button>
              <span className="admin-count">
                {currentPage} / {pages}
              </span>
              <button
                className="admin-btn compact"
                disabled={currentPage >= pages}
                onClick={() => setPage(currentPage + 1)}
              >
                Sau
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  )
}
