import { logAdminAction } from '@/app/lib/admin-audit'
import { requireAdmin } from '@/app/lib/admin-auth'
import {
  ApiError,
  apiErrorResponse,
  assertAllowedKeys,
  enforceRateLimit,
  integerField,
  readJsonObject,
  textField,
} from '@/app/lib/api-security'

export async function GET(request: Request) {
  const denied = await requireAdmin(request, 'contacts:read')
  if (denied) return denied
  const limited = await enforceRateLimit(request, 'admin-contacts-read', 120, 60_000)
  if (limited) return limited
  try {
    const { getContactSubmissions } = await import('@/app/lib/db/queries')
    return Response.json(await getContactSubmissions(), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function PUT(request: Request) {
  const denied = await requireAdmin(request, 'contacts:write')
  if (denied) return denied
  const limited = await enforceRateLimit(request, 'admin-contacts-write', 30, 60_000)
  if (limited) return limited
  try {
    const body = await readJsonObject(request)
    assertAllowedKeys(body, ['id', 'status'])
    const id = integerField(body, 'id', { required: true, min: 1, max: 2147483647 })!
    const status = textField(body, 'status', { required: true, max: 30 })
    if (status !== 'mới' && status !== 'đang xử lý' && status !== 'đã xử lý')
      throw new ApiError('Trạng thái liên hệ không hợp lệ.')
    const { updateContactSubmission } = await import('@/app/lib/db/queries')
    const contact = await updateContactSubmission(id, status)
    if (!contact) throw new ApiError('Không tìm thấy liên hệ.', 404)
    await logAdminAction(request, 'contact.status', id)
    return Response.json(contact, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin(request, 'contacts:write')
  if (denied) return denied
  const limited = await enforceRateLimit(request, 'admin-contacts-write', 30, 60_000)
  if (limited) return limited
  try {
    const body = await readJsonObject(request)
    assertAllowedKeys(body, ['id'])
    const id = integerField(body, 'id', { required: true, min: 1, max: 2147483647 })!
    const { deleteContactSubmission } = await import('@/app/lib/db/queries')
    if (!(await deleteContactSubmission(id))) throw new ApiError('Không tìm thấy liên hệ.', 404)
    await logAdminAction(request, 'contact.delete', id)
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
