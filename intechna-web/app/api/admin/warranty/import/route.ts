import { requireAdmin } from '@/app/lib/admin-auth'
import { logAdminAction } from '@/app/lib/admin-audit'
import {
  ApiError,
  apiErrorResponse,
  enforceRateLimit,
  readJsonObject,
} from '@/app/lib/api-security'
import { validateWarrantyImport } from '@/app/lib/warranty-import'

export async function POST(request: Request) {
  const denied = await requireAdmin(request, 'warranty:write')
  if (denied) return denied
  const blocked = await enforceRateLimit(request, 'admin:warranty:import', 15, 60_000)
  if (blocked) return blocked
  try {
    const { action, lines } = validateWarrantyImport(await readJsonObject(request, 2 * 1024 * 1024))
    if (action === 'commit' && lines.some((line) => line.error))
      throw new ApiError('Sửa các dòng lỗi và kiểm tra lại trước khi nhập.')
    const { importWarrantyRecords } = await import('@/app/lib/db/queries')
    const result = await importWarrantyRecords(lines, action === 'commit')
    if (action === 'commit')
      await logAdminAction(
        request,
        'warranty.import',
        `created:${result.created};skipped:${result.duplicateCount}`,
      )
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
