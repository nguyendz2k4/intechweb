import { logAdminAction } from '@/app/lib/admin-audit'
import { revalidatePath, revalidateTag } from 'next/cache'
import { CATALOG_CACHE_TAG } from '@/app/lib/catalog-cache'
import { requireAdmin } from '@/app/lib/admin-auth'
import {
  ApiError,
  apiErrorResponse,
  assertAllowedKeys,
  enforceRateLimit,
  readJsonObject,
} from '@/app/lib/api-security'
import { productInput, requiredSlug } from '@/app/lib/cms-input'

export async function GET(request: Request) {
  const denied = await requireAdmin(request, 'products:read')
  if (denied) return denied
  const limited = await enforceRateLimit(request, 'admin-products-read', 120, 60_000)
  if (limited) return limited
  try {
    const { getProducts } = await import('@/app/lib/db/queries')
    return Response.json(await getProducts({ includeDrafts: true }), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

async function save(request: Request, updating: boolean) {
  const denied = await requireAdmin(request, 'products:write')
  if (denied) return denied
  const limited = await enforceRateLimit(request, 'admin-products-write', 30, 60_000)
  if (limited) return limited
  try {
    const data = productInput(await readJsonObject(request), updating)
    const { createProduct, updateProduct } = await import('@/app/lib/db/queries')
    const product = await (updating ? updateProduct(data) : createProduct(data))
    if (!product)
      throw new ApiError(
        updating ? 'Không tìm thấy sản phẩm.' : 'Đường dẫn sản phẩm đã tồn tại.',
        updating ? 404 : 409,
      )
    revalidateTag(CATALOG_CACHE_TAG, { expire: 0 })
    await logAdminAction(request, updating ? 'product.update' : 'product.create', product.slug)
    revalidatePath('/', 'layout')
    return Response.json(product, {
      status: updating ? 200 : 201,
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

export async function POST(request: Request) {
  return save(request, false)
}
export async function PUT(request: Request) {
  return save(request, true)
}

export async function DELETE(request: Request) {
  const denied = await requireAdmin(request, 'products:write')
  if (denied) return denied
  const limited = await enforceRateLimit(request, 'admin-products-write', 30, 60_000)
  if (limited) return limited
  try {
    const body = await readJsonObject(request)
    assertAllowedKeys(body, ['slug'])
    const slug = requiredSlug(body)
    const { deleteProduct } = await import('@/app/lib/db/queries')
    await deleteProduct(slug)
    revalidateTag(CATALOG_CACHE_TAG, { expire: 0 })
    await logAdminAction(request, 'product.delete', slug)
    revalidatePath('/', 'layout')
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
