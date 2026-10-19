import { logAdminAction } from '@/app/lib/admin-audit'
import { revalidatePath, revalidateTag } from 'next/cache'
import { PUBLIC_POSTS_CACHE_TAG } from '@/app/lib/editorial-cache'
import { requireAdmin } from '@/app/lib/admin-auth'
import {
  ApiError,
  apiErrorResponse,
  assertAllowedKeys,
  enforceRateLimit,
  readJsonObject,
} from '@/app/lib/api-security'
import { postInput, requiredSlug } from '@/app/lib/cms-input'

export async function GET(request: Request) {
  const denied = await requireAdmin(request, 'posts:read')
  if (denied) return denied
  const limited = await enforceRateLimit(request, 'admin-posts-read', 120, 60_000)
  if (limited) return limited
  try {
    const { getPosts } = await import('@/app/lib/db/queries')
    return Response.json(await getPosts({ includeDrafts: true }), {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch (error) {
    return apiErrorResponse(error)
  }
}

async function save(request: Request, updating: boolean) {
  const denied = await requireAdmin(request, 'posts:write')
  if (denied) return denied
  const limited = await enforceRateLimit(request, 'admin-posts-write', 30, 60_000)
  if (limited) return limited
  try {
    const data = postInput(await readJsonObject(request, 128 * 1024), updating)
    const { createPost, updatePost } = await import('@/app/lib/db/queries')
    const post = await (updating ? updatePost(data) : createPost(data))
    if (!post)
      throw new ApiError(
        updating ? 'Không tìm thấy bài viết.' : 'Đường dẫn bài viết đã tồn tại.',
        updating ? 404 : 409,
      )
    revalidateTag(PUBLIC_POSTS_CACHE_TAG, { expire: 0 })
    revalidatePath('/', 'layout')
    await logAdminAction(request, updating ? 'post.update' : 'post.create', post.slug)
    return Response.json(post, {
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
  const denied = await requireAdmin(request, 'posts:write')
  if (denied) return denied
  const limited = await enforceRateLimit(request, 'admin-posts-write', 30, 60_000)
  if (limited) return limited
  try {
    const body = await readJsonObject(request)
    assertAllowedKeys(body, ['slug'])
    const slug = requiredSlug(body)
    const { deletePost } = await import('@/app/lib/db/queries')
    await deletePost(slug)
    revalidateTag(PUBLIC_POSTS_CACHE_TAG, { expire: 0 })
    revalidatePath('/', 'layout')
    await logAdminAction(request, 'post.delete', slug)
    return Response.json({ ok: true }, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    return apiErrorResponse(error)
  }
}
