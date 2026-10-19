import {
  adminRequestToken,
  clearAdminSessionCookie,
  getAdminSession,
  requireAdmin,
} from '@/app/lib/admin-auth'
import { revokeSession } from '@/app/lib/admin-auth-store'
import { apiErrorResponse } from '@/app/lib/api-security'
import { logAdminAction } from '@/app/lib/admin-audit'

export async function POST(request: Request) {
  const error = await requireAdmin(request)
  if (error) return error
  try {
    const session = (await getAdminSession(request))!
    await revokeSession(adminRequestToken(request)!)
    await logAdminAction(request, 'auth.logout', 'session', session)
    return Response.json(
      { ok: true },
      { headers: { 'Set-Cookie': clearAdminSessionCookie(), 'Cache-Control': 'no-store' } },
    )
  } catch (error) {
    return apiErrorResponse(error)
  }
}
