import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createElement, type ComponentProps } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { ProductEditor } from '../app/(admin)/admin/san-pham/ProductEditor'

const props: ComponentProps<typeof ProductEditor> = {
  draft: {
    slug: 'intech-router',
    name: 'Router',
    brand: 'Intech',
    category: 'Router',
    categorySlug: 'router',
    summary: '',
    priceMode: 'contact',
    price: '',
    imageUrl: '',
    datasheetUrl: '',
    badges: '',
    specs: '',
    applications: '',
    status: 'draft',
  },
  editingSlug: null,
  notice: null,
  busy: false,
  uploading: null,
  uploadFeedback: {},
  localImagePreview: '',
  maxPdfBytes: 10 * 1024 * 1024,
  closeEditor: () => {},
  updateDraft: () => {},
  updateSlug: () => {},
  updateIdentity: () => {},
  updateCategory: () => {},
  saveProduct: async () => {},
  uploadFile: async () => {},
  discardUpload: () => {},
}

test('product category is a single required selection and new products need an explicit choice', () => {
  const html = renderToStaticMarkup(
    createElement(ProductEditor, {
      ...props,
      draft: { ...props.draft, category: '', categorySlug: '' },
    }),
  )
  assert.match(
    html,
    /<select required=""><option value="" disabled="" selected="">Chọn danh mục sản phẩm/,
  )
  for (const slug of [
    'switch',
    'wifi-access-point',
    'router',
    'firewall',
    'module-quang-phu-kien',
    'nas-luu-tru',
  ])
    assert.match(html, new RegExp(`<option value="${slug}">`))
  assert.ok(!html.includes('Đường dẫn danh mục'))
})

test('failed image upload retains its filename and error and blocks saving an unattached image', () => {
  const html = renderToStaticMarkup(
    createElement(ProductEditor, {
      ...props,
      uploadFeedback: {
        image: {
          filename: 'router-photo.png',
          status: 'error',
          message: 'Kho lưu trữ chưa được cấu hình.',
        },
      },
    }),
  )
  assert.match(html, /role="alert"[^>]*><strong>router-photo\.png<\/strong>/)
  assert.ok(html.includes('Kho lưu trữ chưa được cấu hình.'))
  assert.ok(html.includes('Bỏ tệp đã chọn'))
  assert.match(html, /disabled="" type="submit">Lưu sản phẩm/)
})

test('successful image upload shows the uploaded filename, preview and instruction to save', () => {
  const html = renderToStaticMarkup(
    createElement(ProductEditor, {
      ...props,
      draft: { ...props.draft, imageUrl: '/uploads/images/router.png' },
      uploadFeedback: {
        image: {
          filename: 'router-photo.png',
          status: 'success',
          message: 'Đã tải lên. Lưu sản phẩm để ghi lại thay đổi.',
        },
      },
    }),
  )
  assert.ok(html.includes('router-photo.png'))
  assert.match(html, /<img class="admin-image-preview" src="\/uploads\/images\/router\.png"/)
  assert.ok(html.includes('Đã tải lên. Lưu sản phẩm để ghi lại thay đổi.'))
  assert.match(html, /<button class="admin-btn primary" type="submit">Lưu sản phẩm/)
})
