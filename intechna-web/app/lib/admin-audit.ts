import { getAdminSession, type AdminSession } from './admin-auth'

/** Hosting must retain these structured events in its restricted audit log sink. */
export async function logAdminAction(
  request: Request,
  action: string,
  target: string | number,
  verifiedActor?: AdminSession,
) {
  const session = verifiedActor ?? (await getAdminSession(request))
  console.info(
    JSON.stringify({
      event: 'admin.action',
      actor: session?.username ?? 'unknown',
      role: session?.role ?? 'unknown',
      action,
      target: String(target).slice(0, 160),
      at: new Date().toISOString(),
    }),
  )
}
