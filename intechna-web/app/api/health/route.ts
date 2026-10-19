import { createHash, timingSafeEqual } from 'node:crypto'
import { getMysqlDatabase } from '@/app/lib/db/mysql-client.mjs'
import { checkHealthDatabase } from '@/app/lib/health-check'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export async function GET(request: Request) {
  const headers = { 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex, nofollow' }
  const expected = process.env.HEALTHCHECK_TOKEN ?? '',
    received = request.headers.get('authorization') ?? ''
  if (Buffer.byteLength(expected) < 32)
    return Response.json({ status: 'unavailable' }, { status: 503, headers })
  if (
    !timingSafeEqual(
      createHash('sha256').update(`Bearer ${expected}`).digest(),
      createHash('sha256').update(received).digest(),
    )
  )
    return Response.json({ status: 'unauthorized' }, { status: 401, headers })
  try {
    if (!(await checkHealthDatabase(getMysqlDatabase())))
      throw new Error('Required runtime privileges missing')
    return Response.json({ status: 'ok' }, { headers })
  } catch {
    return Response.json({ status: 'unavailable' }, { status: 503, headers })
  }
}
