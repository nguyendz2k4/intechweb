import { ApiError, assertAllowedKeys } from './api-security'
import { warrantyInput, type WarrantyInput } from './warranty-mutation'

export type ImportLine = { row: number; data: WarrantyInput | null; error: string | null }
export function validateWarrantyImport(body: Record<string, unknown>) {
  assertAllowedKeys(body, ['action', 'rows'])
  if (!['preview', 'commit'].includes(String(body.action)))
    throw new ApiError('Thao tác nhập không hợp lệ.')
  if (!Array.isArray(body.rows) || !body.rows.length || body.rows.length > 500)
    throw new ApiError('Chọn từ 1 đến 500 linh kiện mỗi lần nhập.')
  const lines: ImportLine[] = body.rows.map((raw, index) => {
    try {
      if (!raw || typeof raw !== 'object' || Array.isArray(raw))
        throw new ApiError('Dòng dữ liệu không hợp lệ.')
      assertAllowedKeys(raw, [
        'serial',
        'product',
        'model',
        'customer',
        'purchaseDate',
        'warrantyUntil',
        'note',
        'status',
      ])
      const data = warrantyInput(raw)
      if (!data.purchaseDate || !data.warrantyUntil)
        throw new ApiError('Cần nhập ngày mua và hạn bảo hành.')
      return { row: index + 1, data, error: null }
    } catch (error) {
      return {
        row: index + 1,
        data: null,
        error: error instanceof ApiError ? error.message : 'Dòng không hợp lệ.',
      }
    }
  })
  return { action: body.action as 'preview' | 'commit', lines }
}

export function planWarrantyImport(lines: ImportLine[], existing: string[]) {
  const seen = new Set(existing.map((serial) => serial.trim().toLowerCase()))
  const ready: WarrantyInput[] = []
  const issues: { row: number; kind: 'error' | 'duplicate'; message: string }[] = []
  for (const line of lines) {
    if (!line.data) {
      issues.push({ row: line.row, kind: 'error', message: line.error ?? 'Dòng không hợp lệ.' })
      continue
    }
    const key = line.data.serial.toLowerCase()
    if (seen.has(key))
      issues.push({
        row: line.row,
        kind: 'duplicate',
        message: 'Serial đã có trong hệ thống hoặc lặp trong file; sẽ bỏ qua.',
      })
    else {
      seen.add(key)
      ready.push(line.data)
    }
  }
  return {
    ready,
    issues,
    total: lines.length,
    newCount: ready.length,
    duplicateCount: issues.filter((issue) => issue.kind === 'duplicate').length,
    errorCount: issues.filter((issue) => issue.kind === 'error').length,
  }
}
