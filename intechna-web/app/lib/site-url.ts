export const defaultSiteUrl = 'https://intechna.vn'

/** One public deployment setting drives every canonical and crawler URL. */
export function resolveSiteUrl(value: string | undefined) {
  if (!value?.trim()) return defaultSiteUrl
  const url = new URL(value.trim())
  const local = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (
    (url.protocol !== 'https:' && !(local && url.protocol === 'http:')) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  ) {
    throw new Error(
      'NEXT_PUBLIC_SITE_URL phải là tên miền gốc HTTPS, không có đường dẫn hoặc thông tin đăng nhập.',
    )
  }
  return url.origin
}
