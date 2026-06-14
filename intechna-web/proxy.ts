import { NextRequest, NextResponse } from 'next/server'

const ADMIN_SUBDOMAIN = 'admin'

function timingSafeEqualText(a: string, b: string) {
  const enc = new TextEncoder()
  const left = enc.encode(a)
  const right = enc.encode(b)
  if (left.length !== right.length) return false
  let diff = 0
  for (let i = 0; i < left.length; i += 1) diff |= left[i] ^ right[i]
  return diff === 0
}

function unauthorized(message = 'Authentication required') {
  return new NextResponse(message, {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Intech Admin", charset="UTF-8"',
      'Cache-Control': 'no-store',
    },
  })
}

function checkAdminAuth(request: NextRequest): NextResponse | null {
  const adminUser = process.env.ADMIN_USER
  const adminPassword = process.env.ADMIN_PASSWORD

  if (!adminUser || !adminPassword) {
    return new NextResponse('Admin is disabled until ADMIN_USER and ADMIN_PASSWORD are configured.', {
      status: 503,
      headers: { 'Cache-Control': 'no-store' },
    })
  }

  const auth = request.headers.get('authorization')
  if (!auth?.startsWith('Basic ')) return unauthorized()

  let user = ''
  let password = ''
  try {
    const decoded = atob(auth.slice(6))
    const separator = decoded.indexOf(':')
    user = separator >= 0 ? decoded.slice(0, separator) : ''
    password = separator >= 0 ? decoded.slice(separator + 1) : ''
  } catch {
    return unauthorized('Invalid authentication header')
  }

  const ok = timingSafeEqualText(user, adminUser) && timingSafeEqualText(password, adminPassword)
  if (!ok) return unauthorized()

  return null // Auth passed
}

export function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') ?? ''
  const pathname = request.nextUrl.pathname

  // Detect admin subdomain: admin.intechna.vn OR admin.localhost
  const isAdminSubdomain =
    hostname.startsWith(`${ADMIN_SUBDOMAIN}.`) ||
    hostname === `${ADMIN_SUBDOMAIN}.localhost` ||
    hostname === `${ADMIN_SUBDOMAIN}.localhost:3000`

  if (isAdminSubdomain) {
    // Check auth for admin subdomain
    const authError = checkAdminAuth(request)
    if (authError) return authError

    // Rewrite: admin.intechna.vn/san-pham → /admin/san-pham
    const url = request.nextUrl.clone()
    if (!pathname.startsWith('/admin')) {
      url.pathname = `/admin${pathname === '/' ? '' : pathname}`
    }
    const response = NextResponse.rewrite(url)
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return response
  }

  // Protect /admin/* paths directly (fallback for non-subdomain access)
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/')
  const isAdminApiPath = pathname === '/api/admin' || pathname.startsWith('/api/admin/')

  if (isAdminPath || isAdminApiPath) {
    const authError = checkAdminAuth(request)
    if (authError) return authError

    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'no-store')
    response.headers.set('X-Robots-Tag', 'noindex, nofollow')
    return response
  }

  return NextResponse.next()
}

export default proxy

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico, favicon.svg
     * - public files with extensions
     */
    '/((?!_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js|woff2?|ttf|eot)$).*)',
  ],
}
