import { requireAdmin } from '@/app/lib/admin-auth'
import { logAdminAction } from '@/app/lib/admin-audit'
import { apiErrorResponse, enforceRateLimit } from '@/app/lib/api-security'
import { removeWarrantyContent, saveWarrantyContent } from '@/app/lib/warranty-mutation'

export async function GET(request: Request) {
  const denied = await requireAdmin(request, 'warranty:read')
  if (denied) return denied
  const blocked = await enforceRateLimit(request, 'admin:warranty:read', 120, 60 * 1000)
  if (blocked) return blocked
  try {
    const { getWarrantyRecords } = await import('@/app/lib/db/queries')
    return Response.json(await getWarrantyRecords(), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

async function save(request: Request) {
  const denied = await requireAdmin(request, 'warranty:write')
  if (denied) return denied
  const blocked = await enforceRateLimit(request, 'admin:warranty:write', 30, 60 * 1000)
  if (blocked) return blocked
  try {
    const { record, status } = await saveWarrantyContent(
      request,
      () => import('@/app/lib/db/queries'),
    )
    await logAdminAction(
      request,
      request.method === 'PUT' ? 'warranty.update' : 'warranty.create',
      record.code,
    )
    return Response.json(record, { status, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function POST(request: Request) {
  return save(request)
}

export async function PUT(request: Request) {
  return save(request)
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin(request, 'warranty:write')
  if (denied) return denied
  const blocked = await enforceRateLimit(request, 'admin:warranty:write', 30, 60 * 1000)
  if (blocked) return blocked
  try {
    const code = await removeWarrantyContent(request, () => import('@/app/lib/db/queries'))
    await logAdminAction(request, 'warranty.delete', code)
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
