'use client'

import { wordCount, SUMMARY_MAX_WORDS } from '@/app/lib/product-fields'

import { useRef } from 'react'
import { siteConfig } from '@/app/data'
import { catalogCategoryName } from '@/app/catalog-utils'
import { PRODUCT_CATEGORY_OPTIONS } from '@/app/lib/product-categories'
import { Notice, publicPageUrl, safeAssetUrl } from '../AdminUi'
import type { ProductAdminState, ProductDraft } from './use-product-admin'

type ProductEditorProps = Pick<
  ProductAdminState,
  | 'draft'
  | 'editingSlug'
  | 'notice'
  | 'busy'
  | 'uploading'
  | 'uploadFeedback'
  | 'localImagePreview'
  | 'maxPdfBytes'
  | 'closeEditor'
  | 'updateDraft'
  | 'updateSlug'
  | 'updateIdentity'
  | 'updateCategory'
  | 'saveProduct'
  | 'uploadFile'
  | 'discardUpload'
>

export function ProductEditor({
  draft,
  editingSlug,
  notice,
  busy,
  uploading,
  uploadFeedback,
  localImagePreview,
  maxPdfBytes,
  closeEditor,
  updateDraft,
  updateSlug,
  updateIdentity,
  updateCategory,
  saveProduct,
  uploadFile,
  discardUpload,
}: ProductEditorProps) {
  const imageInput = useRef<HTMLInputElement>(null)
  const datasheetInput = useRef<HTMLInputElement>(null)
  const categoryName = catalogCategoryName(draft.categorySlug, [
    {
      ...draft,
      badges: [],
      specs: [],
      applications: [],
    },
  ])
  const imagePreview = localImagePreview || safeAssetUrl(draft.imageUrl)
  const datasheetPreview = safeAssetUrl(draft.datasheetUrl)

  return (
    <>
      <div className="admin-editor-header">
        <div>
          <h2>{editingSlug ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm'}</h2>
          <p>Nội dung được hiển thị theo mẫu sản phẩm hiện tại của website.</p>
        </div>
        <button className="admin-btn" disabled={busy || Boolean(uploading)} onClick={closeEditor}>
          ← Danh sách sản phẩm
        </button>
      </div>
      <Notice notice={notice} />
      <form className="admin-editor-layout" onSubmit={saveProduct}>
        <fieldset className="admin-card admin-form" disabled={busy}>
          <h2>Thông tin sản phẩm</h2>
          <label>
            <span>Tên / model *</span>
            <input
              required
              maxLength={200}
              value={draft.name}
              onChange={(event) => updateIdentity('name', event.target.value)}
              placeholder="FortiGate 100F"
            />
          </label>
          <div className="admin-field-row">
            <label>
              <span>Thương hiệu *</span>
              <input
                required
                maxLength={100}
                value={draft.brand}
                onChange={(event) => updateIdentity('brand', event.target.value)}
                placeholder="Fortinet"
              />
            </label>
            <label>
              <span>Danh mục *</span>
              <select
                required
                value={draft.categorySlug}
                onChange={(event) => updateCategory(event.target.value)}
              >
                <option value="" disabled>
                  Chọn danh mục sản phẩm
                </option>
                {PRODUCT_CATEGORY_OPTIONS.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {category.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label>
            <span>Đường dẫn sản phẩm *</span>
            <input
              required
              readOnly={Boolean(editingSlug)}
              pattern="[a-z0-9]+(-[a-z0-9]+)*"
              maxLength={160}
              value={draft.slug}
              onChange={(event) => updateSlug(event.target.value)}
            />
            <small>
              {editingSlug
                ? 'Đường dẫn được giữ cố định để bảo toàn liên kết hiện tại.'
                : 'Tự tạo từ thương hiệu và model. Có thể điều chỉnh trước lần lưu đầu tiên.'}
            </small>
          </label>
          <label>
            <span>Mô tả ngắn</span>
            <textarea
              maxLength={16000}
              value={draft.summary}
              onChange={(event) => updateDraft('summary', event.target.value)}
              placeholder="Mô tả thiết bị, tính năng chính và nhu cầu phù hợp."
            />
            <small>
              {wordCount(draft.summary)} / {SUMMARY_MAX_WORDS} từ · Dùng trong trang sản phẩm và mô
              tả tìm kiếm.
            </small>
          </label>
          <div className="admin-field-row">
            <label>
              <span>Hiển thị giá</span>
              <select
                value={draft.priceMode}
                onChange={(event) =>
                  updateDraft('priceMode', event.target.value as 'price' | 'contact')
                }
              >
                <option value="contact">Liên hệ</option>
                <option value="price">Hiển thị giá bán</option>
              </select>
            </label>
            {draft.priceMode === 'price' && (
              <label>
                <span>Giá bán (VND) *</span>
                <input
                  type="number"
                  min="1"
                  max="999999999999"
                  step="1"
                  required
                  value={draft.price}
                  onChange={(event) => updateDraft('price', event.target.value)}
                  placeholder="2500000"
                />
                <small>Nhập số tiền, ví dụ 2500000 = 2.500.000 ₫.</small>
              </label>
            )}
          </div>
          <div className="admin-field-section admin-form">
            <h3>Thông số và ứng dụng</h3>
            <label>
              <span>Thông số kỹ thuật</span>
              <textarea
                value={draft.specs}
                onChange={(event) => updateDraft('specs', event.target.value)}
                placeholder="Mỗi dòng là một thông số"
              />
              <small>Mỗi dòng là một thông số trong danh sách hiện tại.</small>
            </label>
            <label>
              <span>Ứng dụng</span>
              <textarea
                value={draft.applications}
                onChange={(event) => updateDraft('applications', event.target.value)}
                placeholder="Mỗi dòng là một ứng dụng"
              />
            </label>
            <label>
              <span>Nhãn sản phẩm</span>
              <textarea
                value={draft.badges}
                onChange={(event) => updateDraft('badges', event.target.value)}
                placeholder="Mỗi dòng là một nhãn, nếu có"
              />
              <small>Chỉ nhập nhãn có ý nghĩa với khách hàng.</small>
            </label>
          </div>
          <div className="admin-field-section admin-form">
            <h3>Ảnh và tài liệu</h3>
            <label>
              <span>Ảnh sản phẩm</span>
              <input
                ref={imageInput}
                disabled={busy || Boolean(uploading)}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onClick={(event) => {
                  event.currentTarget.value = ''
                }}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void uploadFile(file, 'image')
                }}
              />
              <small>
                JPG, PNG, WebP hoặc GIF · Tối đa 3 MB
                {uploading === 'image' ? ' · Đang tải ảnh…' : ''}
              </small>
            </label>
            {uploadFeedback.image && (
              <div
                role={uploadFeedback.image.status === 'error' ? 'alert' : 'status'}
                className={`admin-note ${uploadFeedback.image.status === 'error' ? 'error' : 'success'}`}
              >
                <strong>{uploadFeedback.image.filename}</strong>
                <p>{uploadFeedback.image.message}</p>
                {uploadFeedback.image.status === 'error' && (
                  <button
                    className="admin-btn"
                    type="button"
                    onClick={() => {
                      if (imageInput.current) imageInput.current.value = ''
                      discardUpload('image')
                    }}
                  >
                    Bỏ tệp đã chọn
                  </button>
                )}
              </div>
            )}
            <label>
              <span>Đường dẫn ảnh</span>
              <input
                maxLength={2000}
                disabled={uploading === 'image'}
                value={draft.imageUrl}
                onChange={(event) => updateDraft('imageUrl', event.target.value)}
                placeholder="https://… hoặc /uploads/images/…"
              />
            </label>
            {imagePreview && (
              // eslint-disable-next-line @next/next/no-img-element -- CMS previews use original asset URLs and intrinsic dimensions without image optimization.
              <img
                className="admin-image-preview"
                src={imagePreview}
                alt={draft.name || 'Ảnh sản phẩm đang soạn'}
              />
            )}
            <label>
              <span>Datasheet PDF</span>
              <input
                ref={datasheetInput}
                disabled={busy || Boolean(uploading)}
                type="file"
                accept="application/pdf"
                onClick={(event) => {
                  event.currentTarget.value = ''
                }}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void uploadFile(file, 'datasheet')
                }}
              />
              <small>
                PDF · Tối đa {maxPdfBytes / (1024 * 1024)} MB
                {uploading === 'datasheet' ? ' · Đang tải tài liệu…' : ''}
              </small>
            </label>
            {uploadFeedback.datasheet && (
              <div
                role={uploadFeedback.datasheet.status === 'error' ? 'alert' : 'status'}
                className={`admin-note ${uploadFeedback.datasheet.status === 'error' ? 'error' : 'success'}`}
              >
                <strong>{uploadFeedback.datasheet.filename}</strong>
                <p>{uploadFeedback.datasheet.message}</p>
                {uploadFeedback.datasheet.status === 'error' && (
                  <button
                    className="admin-btn"
                    type="button"
                    onClick={() => {
                      if (datasheetInput.current) datasheetInput.current.value = ''
                      discardUpload('datasheet')
                    }}
                  >
                    Bỏ tệp đã chọn
                  </button>
                )}
              </div>
            )}
            <label>
              <span>Đường dẫn datasheet</span>
              <input
                maxLength={2000}
                disabled={uploading === 'datasheet'}
                value={draft.datasheetUrl}
                onChange={(event) => updateDraft('datasheetUrl', event.target.value)}
                placeholder="https://… hoặc /uploads/datasheets/…pdf"
              />
            </label>
            {datasheetPreview && (
              <a href={datasheetPreview} target="_blank" rel="noopener noreferrer">
                Mở datasheet ↗
              </a>
            )}
          </div>
        </fieldset>
        <aside className="admin-editor-aside">
          <fieldset className="admin-card admin-form" disabled={busy}>
            <h3>Xuất bản</h3>
            <label>
              <span>Trạng thái</span>
              <select
                value={draft.status}
                onChange={(event) =>
                  updateDraft('status', event.target.value as ProductDraft['status'])
                }
              >
                <option value="draft">Bản nháp</option>
                <option value="published">Đã xuất bản</option>
              </select>
              <small>Bản nháp không xuất hiện trên website công khai.</small>
            </label>
            <div className="admin-actions">
              <button
                className="admin-btn primary"
                disabled={
                  busy ||
                  Boolean(uploading) ||
                  Object.values(uploadFeedback).some((file) => file.status === 'error')
                }
                type="submit"
              >
                {busy ? 'Đang lưu…' : 'Lưu sản phẩm'}
              </button>
            </div>
            {editingSlug && draft.status === 'published' && (
              <a
                href={publicPageUrl(`/san-pham/catalog/${encodeURIComponent(editingSlug)}`)}
                target="_blank"
                rel="noopener noreferrer"
              >
                Xem trang sản phẩm ↗
              </a>
            )}
          </fieldset>
          <section className="admin-card">
            <h3>Xem trước tìm kiếm</h3>
            <div className="admin-seo-preview">
              <span className="admin-seo-url">
                {siteConfig.domain}/san-pham/catalog/{draft.slug || 'duong-dan-san-pham'}
              </span>
              <h4>
                {draft.name || 'Tên sản phẩm'} – {categoryName || 'Danh mục'} |{' '}
                {siteConfig.shortName}
              </h4>
              <p>
                {draft.summary} Liên hệ Intech để tư vấn cấu hình và báo giá{' '}
                {draft.name || 'sản phẩm'}.
              </p>
            </div>
            <p className="admin-seo-hint">
              Tiêu đề và mô tả lấy từ dữ liệu sản phẩm theo quy tắc của website.
            </p>
          </section>
        </aside>
      </form>
    </>
  )
}
