import { ApiError, assertAllowedKeys, dateField, readJsonObject, textField } from './api-security'
import type { WarrantyRecord } from './db/schema'
import { adminWarrantyRecord } from './warranty'

export type WarrantyInput = {
  serial: string
  customer: string
  product: string
  model: string
  purchaseDate: string
  warrantyUntil: string
  status: string
  note: string
}
type WarrantyWrite = WarrantyInput & { code: string }
export type WarrantyRepository = {
  getNextWarrantyCode: () => Promise<string>
  createWarranty: (input: WarrantyWrite) => Promise<WarrantyRecord | null>
  updateWarranty: (input: WarrantyWrite) => Promise<WarrantyRecord | null>
  deleteWarranty: (code: string) => Promise<boolean>
}
type RepositorySource = WarrantyRepository | (() => Promise<WarrantyRepository>)
const writableFields = [
  'serial',
  'customer',
  'product',
  'model',
  'purchaseDate',
  'warrantyUntil',
  'status',
  'note',
] as const

function warrantyCode(body: Record<string, unknown>) {
  return textField(body, 'code', {
    required: true,
    min: 6,
    max: 128,
    pattern: /^[a-zA-Z0-9._\-/]+$/,
  })
}

export function warrantyInput(body: Record<string, unknown>): WarrantyInput {
  const serial = textField(body, 'serial', {
    required: true,
    min: 6,
    max: 128,
    pattern: /^[a-zA-Z0-9._\-/]+$/,
  })
  const customer = textField(body, 'customer', { required: true, max: 240 })
  const product = textField(body, 'product', { required: true, max: 240 })
  const model = textField(body, 'model', { max: 240 })
  const purchaseDate = dateField(body, 'purchaseDate')
  const warrantyUntil = dateField(body, 'warrantyUntil')
  if (purchaseDate && warrantyUntil && warrantyUntil < purchaseDate)
    throw new ApiError('Hạn bảo hành phải bằng hoặc sau ngày mua.')
  const status = textField(body, 'status', { max: 40 }) || 'Còn bảo hành'
  if (
    ![
      'Còn bảo hành',
      'Bảo hành đặc biệt',
      'Hết hạn',
      'Hết hạn bảo hành',
      'Cần xác nhận thời hạn',
    ].includes(status)
  )
    throw new ApiError('Trạng thái bảo hành không hợp lệ.')
  const note = textField(body, 'note', { max: 3000 })
  return { serial, customer, product, model, purchaseDate, warrantyUntil, status, note }
}

/** Purchase dates can predate launch; existing codes remain stable when dates are corrected. */
export async function saveWarrantyContent(
  request: Request,
  repository: RepositorySource,
  now = new Date(),
) {
  const updating = request.method === 'PUT'
  if (!updating && request.method !== 'POST') throw new ApiError('Thao tác không hợp lệ.', 405)
  const body = await readJsonObject(request, 16 * 1024)
  assertAllowedKeys(body, updating ? ['code', ...writableFields] : writableFields)
  const input = warrantyInput(body)
  const existingCode = updating ? warrantyCode(body) : null
  const storage = typeof repository === 'function' ? await repository() : repository
  const code = existingCode ?? (await storage.getNextWarrantyCode())
  const record = await (updating ? storage.updateWarranty : storage.createWarranty)({
    code,
    ...input,
  })
  if (!record)
    throw new ApiError(
      updating
        ? 'Không tìm thấy phiếu bảo hành.'
        : 'Chưa thể lưu phiếu bảo hành. Vui lòng thử lại.',
      updating ? 404 : 503,
    )
  return {
    record: { ...adminWarrantyRecord(record, now), storedStatus: record.status },
    status: updating ? 200 : 201,
  }
}

export async function removeWarrantyContent(request: Request, repository: RepositorySource) {
  const body = await readJsonObject(request, 16 * 1024)
  assertAllowedKeys(body, ['code'])
  const code = warrantyCode(body)
  const storage = typeof repository === 'function' ? await repository() : repository
  if (!(await storage.deleteWarranty(code)))
    throw new ApiError('Không tìm thấy phiếu bảo hành.', 404)
  return code
}
