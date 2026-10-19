import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from './app/lib/admin-auth'

function adminHeaders(response: Response) {
  response.headers.set('Cache-Control', 'no-store, max-age=0')
  response.headers.set('X-Robots-Tag', 'noindex, nofollow')
  return response
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname
  const host = (request.headers.get('host') ?? request.nextUrl.host).split(':')[0].toLowerCase()
  const isAdminHost = host.startsWith('admin.')
  const isAdminApi = pathname === '/api/admin' || pathname.startsWith('/api/admin/')
  const isAdminPage = pathname === '/admin' || pathname.startsWith('/admin/')

  // Login is outside the admin layout and API routing is never rewritten by hostname.
  if (pathname === '/admin-login' || pathname === '/api/admin/auth/login')
    return adminHeaders(NextResponse.next())

  if (isAdminApi || isAdminPage) {
    const error = await requireAdmin(request)
    if (error) {
      if (isAdminPage && error.status === 401)
        return adminHeaders(NextResponse.redirect(new URL('/admin-login', request.url)))
      return adminHeaders(error)
    }
    return adminHeaders(NextResponse.next())
  }

  if (isAdminHost) {
    // Static assets and public API endpoints keep their original URL.
    if (
      pathname === '/api' ||
      pathname.startsWith('/api/') ||
      pathname.startsWith('/_next/') ||
      pathname.startsWith('/images/') ||
      pathname.startsWith('/fonts/') ||
      /\.[a-zA-Z0-9]+$/.test(pathname)
    )
      return NextResponse.next()
    const error = await requireAdmin(request)
    if (error) {
      if (error.status === 401)
        return adminHeaders(NextResponse.redirect(new URL('/admin-login', request.url)))
      return adminHeaders(error)
    }
    const url = request.nextUrl.clone()
    url.pathname = `/admin${pathname === '/' ? '' : pathname}`
    return adminHeaders(NextResponse.rewrite(url))
  }
  return NextResponse.next()
}

export default proxy

export const config = {
  // Explicit admin matchers stop extension-looking paths from escaping authentication.
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
    '/admin-login',
    '/((?!_next/static|_next/image).*)',
  ],
}
