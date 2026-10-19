/** Admin selections use the same slugs as the six public product category pages. */
export const PRODUCT_CATEGORY_OPTIONS = [
  { slug: 'switch', label: 'Switch' },
  { slug: 'wifi-access-point', label: 'WiFi Access Point' },
  { slug: 'router', label: 'Router' },
  { slug: 'firewall', label: 'Firewall' },
  { slug: 'module-quang-phu-kien', label: 'Module quang và phụ kiện hạ tầng' },
  { slug: 'nas-luu-tru', label: 'NAS-server và lưu trữ dữ liệu' },
] as const

export function productCategoryOption(slug: string) {
  return PRODUCT_CATEGORY_OPTIONS.find((category) => category.slug === slug)
}
