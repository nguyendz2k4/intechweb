import { requireAdmin } from '@/app/lib/admin-auth'
import { revalidatePath, revalidateTag } from 'next/cache'
import { PUBLIC_SERVICES_CACHE_TAG } from '@/app/lib/editorial-cache'
import { saveServiceContent } from '@/app/lib/service-mutation'
import { logAdminAction } from '@/app/lib/admin-audit'
import {
  apiErrorResponse,
  assertAllowedKeys,
  enforceRateLimit,
  readJsonObject,
  textField,
} from '@/app/lib/api-security'

export async function GET(request: Request) {
  const denied = await requireAdmin(request, 'services:read')
  if (denied) return denied
  const blocked = await enforceRateLimit(request, 'admin:services:read', 120, 60 * 1000)
  if (blocked) return blocked
  try {
    const { getServices } = await import('@/app/lib/db/queries')
    return Response.json(await getServices(), { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function POST(request: Request) {
  const denied = await requireAdmin(request, 'services:write')
  if (denied) return denied
  const blocked = await enforceRateLimit(request, 'admin:services:write', 30, 60 * 1000)
  if (blocked) return blocked
  try {
    const { service, status } = await saveServiceContent(
      request,
      () => import('@/app/lib/db/queries'),
    )
    revalidateTag(PUBLIC_SERVICES_CACHE_TAG, { expire: 0 })
    revalidatePath('/dich-vu')
    revalidatePath(`/dich-vu/${service.slug}`)
    revalidatePath('/giai-phap')
    revalidatePath(`/giai-phap/${service.slug}`)
    revalidatePath('/bao-gia')
    revalidatePath('/tin-tuc/[slug]', 'page')
    revalidatePath('/sitemap.xml')
    await logAdminAction(request, 'services.save', service.slug)
    return Response.json(service, { status, headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function PUT(request: Request) {
  return POST(request)
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin(request, 'services:write')
  if (denied) return denied
  const blocked = await enforceRateLimit(request, 'admin:services:write', 30, 60 * 1000)
  if (blocked) return blocked
  try {
    const body = await readJsonObject(request, 1024)
    assertAllowedKeys(body, ['slug'])
    const slug = textField(body, 'slug', {
      required: true,
      max: 160,
      pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    })
    const { deleteService } = await import('@/app/lib/db/queries')
    const result = await deleteService(slug)
    revalidateTag(PUBLIC_SERVICES_CACHE_TAG, { expire: 0 })
    revalidatePath('/dich-vu')
    revalidatePath(`/dich-vu/${slug}`)
    revalidatePath('/giai-phap')
    revalidatePath(`/giai-phap/${slug}`)
    revalidatePath('/bao-gia')
    revalidatePath('/tin-tuc/[slug]', 'page')
    revalidatePath('/sitemap.xml')
    await logAdminAction(request, 'services.delete', slug)
    return Response.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
