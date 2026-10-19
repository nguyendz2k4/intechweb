/** Shared by paste/typing handlers and the API. */
export function productSlug(value: string) {
  return value
    .replace(/[®™]/g, '')
    .normalize('NFKD')
    .toLowerCase()
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[\u200b-\u200d\ufeff®™]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 160)
    .replace(/-+$/g, '')
}

export const SUMMARY_MAX_WORDS = 1000
export function wordCount(value: string) {
  return value.trim().split(/\s+/u).filter(Boolean).length
}

export function productPriceLabel(price: number | null | undefined) {
  return typeof price === 'number' && Number.isSafeInteger(price) && price > 0
    ? new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0,
      }).format(price)
    : 'Liên hệ'
}
