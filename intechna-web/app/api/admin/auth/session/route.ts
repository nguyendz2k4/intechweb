import { getAdminSession, requireAdmin } from '@/app/lib/admin-auth'

export async function GET(request: Request) {
  const error = await requireAdmin(request)
  if (error) return error
  return Response.json(await getAdminSession(request), { headers: { 'Cache-Control': 'no-store' } })
}
