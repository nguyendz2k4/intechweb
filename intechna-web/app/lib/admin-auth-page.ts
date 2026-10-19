import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import {
  getAdminSession,
  requireAdmin,
  type AdminPermission,
  type AdminSession,
} from './admin-auth'

/** Repeat authorization at the data-loading page, even when reached through a rewrite. */
export async function requireAdminPage(permission?: AdminPermission): Promise<AdminSession> {
  const incomingHeaders = await headers()
  const host = incomingHeaders.get('host') ?? 'invalid.local'
  const request = new Request(`http://${host}/admin`, { headers: incomingHeaders })
  const error = await requireAdmin(request, permission)
  if (error) redirect(error.status === 403 ? '/admin-login?error=forbidden' : '/admin-login')
  return (await getAdminSession(request))!
}
