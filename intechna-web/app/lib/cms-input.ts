import {
  ApiError,
  assertAllowedKeys,
  httpUrlField,
  stringArrayField,
  textField,
} from './api-security'
import { productCategoryOption } from './product-categories'
import { productSlug, wordCount, SUMMARY_MAX_WORDS } from './product-fields'

export function contentSlug(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160)
    .replace(/-+$/g, '')
}

export function requiredSlug(body: Record<string, unknown>) {
  return textField(body, 'slug', {
    required: true,
    max: 160,
    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  })
}

function publicationStatus(body: Record<string, unknown>): 'published' | 'draft' {
  const status = body.status === undefined ? 'draft' : body.status
  if (status !== 'published' && status !== 'draft')
    throw new ApiError('Trạng thái đăng tải không hợp lệ.')
  return status
}

export function serviceInput(body: Record<string, unknown>, updating = false) {
  assertAllowedKeys(body, [
    'slug',
    'title',
    'description',
    'keywords',
    'deliverables',
    'benefits',
    'status',
  ])
  const title = textField(body, 'title', { required: true, max: 180 })
  if (body.slug !== undefined && typeof body.slug !== 'string')
    throw new ApiError('Đường dẫn phải là chuỗi.')
  const status = publicationStatus(body)
  const deliverables = stringArrayField(body, 'deliverables', { maxItems: 30, maxLength: 500 })
  const benefits = stringArrayField(body, 'benefits', { maxItems: 30, maxLength: 500 })
  if (status === 'published' && (!deliverables.length || !benefits.length))
    throw new ApiError('Dịch vụ xuất bản cần ít nhất một hạng mục bàn giao và một lợi ích.')
  return {
    slug: requiredSlug({ slug: updating ? body.slug : body.slug || contentSlug(title) }),
    title,
    description: textField(body, 'description', { required: true, max: 2000 }),
    keywords: textField(body, 'keywords', { max: 500 }),
    deliverables,
    benefits,
    status,
  }
}

export function productInput(body: Record<string, unknown>, updating = false) {
  assertAllowedKeys(body, [
    'slug',
    'name',
    'brand',
    'category',
    'categorySlug',
    'summary',
    'priceVnd',
    'badges',
    'specs',
    'applications',
    'imageUrl',
    'datasheetUrl',
    'status',
  ])
  const name = textField(body, 'name', { required: true, max: 200 })
  const brand = textField(body, 'brand', { required: true, max: 100 })
  if (body.slug !== undefined && typeof body.slug !== 'string')
    throw new ApiError('Đường dẫn phải là chuỗi.')
  if (typeof body.slug === 'string' && /[./\\?#]/.test(body.slug))
    throw new ApiError('Đường dẫn chỉ là tên sản phẩm, không chứa địa chỉ web hay dấu gạch chéo.')
  const slug = requiredSlug({
    slug: updating ? body.slug : productSlug(String(body.slug || `${brand}-${name}`)),
  })
  const categoryLabel = textField(body, 'category', { required: true, max: 100 })
  const categorySlug = textField(body, 'categorySlug', {
    required: true,
    max: 100,
    pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  })
  const category = productCategoryOption(categorySlug)
  if (!category && !updating)
    throw new ApiError('Vui lòng chọn một trong sáu danh mục sản phẩm có sẵn.')
  const summary = textField(body, 'summary', { max: 16000 })
  if (wordCount(summary) > SUMMARY_MAX_WORDS) throw new ApiError('Mô tả ngắn tối đa 1.000 từ.')
  const priceVnd = body.priceVnd ?? null
  if (
    priceVnd !== null &&
    (typeof priceVnd !== 'number' ||
      !Number.isSafeInteger(priceVnd) ||
      priceVnd <= 0 ||
      priceVnd > 999_999_999_999)
  )
    throw new ApiError('Giá phải là số nguyên VND từ 1 đến 999.999.999.999, hoặc chọn Liên hệ.')
  return {
    slug,
    name,
    priceVnd,
    brand: textField({ brand: brand.toUpperCase() }, 'brand', { required: true, max: 100 }),
    category: category?.label ?? categoryLabel,
    categorySlug,
    summary,
    badges: stringArrayField(body, 'badges', { maxItems: 12, maxLength: 80 }),
    specs: stringArrayField(body, 'specs', { maxItems: 50, maxLength: 500 }),
    applications: stringArrayField(body, 'applications', { maxItems: 30, maxLength: 500 }),
    imageUrl: httpUrlField(body, 'imageUrl', { allowLocal: true }),
    datasheetUrl: httpUrlField(body, 'datasheetUrl', { allowLocal: true }),
    status: publicationStatus(body),
  }
}

export function postInput(body: Record<string, unknown>, updating = false) {
  assertAllowedKeys(body, ['slug', 'title', 'description', 'body', 'status'])
  const title = textField(body, 'title', { required: true, max: 200 })
  if (body.slug !== undefined && typeof body.slug !== 'string')
    throw new ApiError('Đường dẫn phải là chuỗi.')
  return {
    slug: requiredSlug({ slug: updating ? body.slug : body.slug || contentSlug(title) }),
    title,
    description: textField(body, 'description', { required: true, max: 3000 }),
    body: textField(body, 'body', { max: 100_000 }),
    status: publicationStatus(body),
  }
}
