export const WARRANTY_MIN_LENGTH = 6
export const WARRANTY_MAX_LENGTH = 128

/** Keep stored legacy IDs intact while accepting their shorter public alias. */
export function displayWarrantyCode(code: string) {
  return code.replace(/^(?:INTECH|INT)-\d{4}-([A-F0-9]{12})$/i, 'INT-$1').toUpperCase()
}

export type PublicWarrantyRecord = {
  code: string
  serial: string
  customer: string
  product: string
  model?: string | null
  purchaseDate: string | null
  warrantyUntil: string | null
  status: 'Còn bảo hành' | 'Hết hạn bảo hành' | 'Cần xác nhận thời hạn'
  coverage: 'valid' | 'expired' | 'unconfirmed'
  days: number | null
}

type WarrantySource = {
  code: string
  serial: string
  customer: string
  product: string
  model?: string | null
  purchaseDate: string | null
  warrantyUntil: string | null
  status: string | null
}

export function validateWarrantyQuery(query: string): string | null {
  if (query.trim().length < WARRANTY_MIN_LENGTH)
    return 'Vui lòng nhập tối thiểu 6 ký tự của mã phiếu hoặc serial.'
  if (query.trim().length > WARRANTY_MAX_LENGTH)
    return 'Mã phiếu hoặc serial không được vượt quá 128 ký tự.'
  if (!/^[a-zA-Z0-9._\-/]+$/.test(query.trim()))
    return 'Vui lòng chỉ nhập chữ, số, dấu gạch ngang, gạch dưới, dấu chấm hoặc dấu gạch chéo.'
  return null
}

export function maskWarrantyCustomer(customer: string): string {
  const name = customer.trim()
  if (!name) return 'Đã ẩn thông tin'
  const companyPrefix =
    /^(?:công ty(?: (?:tnhh|cổ phần|cp))?|phòng khám|khách sạn|bệnh viện|trường học|trường|doanh nghiệp|hộ kinh doanh)\s+/i
  const prefix = name.match(companyPrefix)?.[0] ?? ''
  const privateWords = name.slice(prefix.length).split(/\s+/).filter(Boolean)
  const masked = privateWords.map((word) => `${Array.from(word)[0]}***`).join(' ')
  return `${prefix}${masked}`.trim() || 'Đã ẩn thông tin'
}

function parseDate(value: string | null): string | null {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value ? value : null
}

export function formatWarrantyDate(value: string | null): string {
  const date = parseDate(value)
  if (!date) return 'Chưa cập nhật'
  const [year, month, day] = date.split('-')
  return `${day}/${month}/${year}`
}

/** Add calendar months, keeping month-end purchases within the target month. */
export function addWarrantyMonths(value: string, months: number): string {
  const date = parseDate(value)
  if (!date || !Number.isSafeInteger(months) || months < 0) return ''
  const result = new Date(`${date}T00:00:00Z`)
  const day = result.getUTCDate()
  result.setUTCMonth(result.getUTCMonth() + months, 1)
  const monthEnd = new Date(result)
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1, 0)
  result.setUTCDate(Math.min(day, monthEnd.getUTCDate()))
  return Number.isNaN(result.getTime()) ? '' : parseDate(result.toISOString().slice(0, 10)) || ''
}

export function warrantyStatusForEditing(record: {
  status: string | null
  storedStatus?: string | null
}) {
  // A date-derived "Hết hạn" must return to automatic mode when its expiry is extended.
  const stored = record.storedStatus
  if (/hết hạn|hết bảo hành/i.test(stored ?? '')) return 'Hết hạn'
  if ((stored ?? record.status) === 'Bảo hành đặc biệt') return 'Bảo hành đặc biệt'
  return 'Còn bảo hành'
}

type WarrantyStatusSource = Pick<WarrantySource, 'warrantyUntil' | 'status'>
const vietnamCalendar = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Ho_Chi_Minh',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function warrantyCoverage(record: WarrantyStatusSource, now = new Date()) {
  // Warranty dates are calendar dates in Vietnam, independent of the server's timezone.
  const parts = vietnamCalendar.formatToParts(now)
  const part = (type: string) => parts.find((item) => item.type === type)?.value
  const today = `${part('year')}-${part('month')}-${part('day')}`
  const expiry = parseDate(record.warrantyUntil)
  const days = expiry
    ? Math.round(
        (Date.parse(`${expiry}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86_400_000,
      )
    : null
  const explicitlyExpired = /hết hạn|hết bảo hành/i.test(record.status ?? '')
  const coverage: PublicWarrantyRecord['coverage'] =
    explicitlyExpired || (days !== null && days < 0)
      ? 'expired'
      : days !== null
        ? 'valid'
        : 'unconfirmed'

  return { expiry, days, coverage }
}

/** Both admin and public use the same Vietnam expiry boundary and date validation. */
export function adminWarrantyRecord<T extends WarrantyStatusSource>(record: T, now = new Date()) {
  const { coverage } = warrantyCoverage(record, now)
  const status =
    coverage === 'expired'
      ? 'Hết hạn'
      : coverage === 'unconfirmed'
        ? 'Cần xác nhận thời hạn'
        : record.status === 'Bảo hành đặc biệt'
          ? record.status
          : 'Còn bảo hành'
  return { ...record, status }
}

export function publicWarrantyRecord(
  record: WarrantySource,
  now = new Date(),
): PublicWarrantyRecord {
  const { expiry, days, coverage } = warrantyCoverage(record, now)

  // Allowlist fields only. Database IDs, arbitrary status text and internal notes never reach the public API.
  return {
    code: displayWarrantyCode(record.code),
    serial: record.serial,
    customer: maskWarrantyCustomer(record.customer),
    product: record.product,
    model: record.model ?? '',
    purchaseDate: parseDate(record.purchaseDate),
    warrantyUntil: expiry,
    status:
      coverage === 'expired'
        ? 'Hết hạn bảo hành'
        : coverage === 'valid'
          ? 'Còn bảo hành'
          : 'Cần xác nhận thời hạn',
    coverage,
    days,
  }
}
