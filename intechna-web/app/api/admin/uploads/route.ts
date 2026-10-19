import { requireAdmin } from '@/app/lib/admin-auth'
import { logAdminAction } from '@/app/lib/admin-audit'
import {
  ApiError,
  apiErrorResponse,
  enforceRateLimit,
  readRequestBytes,
} from '@/app/lib/api-security'
import {
  configuredUploadStorage,
  storeUpload,
  uploadMultipartLimit,
} from '@/app/lib/upload-storage'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const denied = await requireAdmin(request, 'uploads:write')
  if (denied) return denied
  if (process.env.UPLOADS_ENABLED === 'false')
    return apiErrorResponse(new ApiError('Tải tệp tạm thời chưa khả dụng.', 503))
  const blocked = await enforceRateLimit(request, 'admin:uploads:write', 15, 60 * 1000)
  if (blocked) return blocked
  try {
    const storage = configuredUploadStorage()
    if (!request.headers.get('content-type')?.toLowerCase().startsWith('multipart/form-data;'))
      throw new ApiError('Yêu cầu tải tệp phải sử dụng multipart/form-data.', 415)
    const bytes = await readRequestBytes(request, uploadMultipartLimit(storage))
    let form: FormData
    try {
      form = await new Request(request.url, {
        method: 'POST',
        headers: request.headers,
        body: bytes as BodyInit,
      }).formData()
    } catch {
      throw new ApiError('Nội dung tải tệp không hợp lệ.')
    }
    if (
      Array.from(form.keys()).some((key) => !['file', 'kind'].includes(key)) ||
      form.getAll('file').length !== 1 ||
      form.getAll('kind').length !== 1
    )
      throw new ApiError('Yêu cầu tải tệp chứa trường không hợp lệ.')
    const file = form.get('file')
    const kind = form.get('kind')
    if (!(file instanceof File)) throw new ApiError('Thiếu tệp tải lên.')
    if (kind !== 'image' && kind !== 'datasheet')
      throw new ApiError('Loại tệp tải lên không hợp lệ.')
    const payload = new Uint8Array(await file.arrayBuffer())
    const uploaded = await storeUpload(payload, file.type, kind, storage)
    await logAdminAction(request, 'uploads.create', uploaded.filename)
    return Response.json({ url: uploaded.url }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
