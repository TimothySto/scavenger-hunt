import { NextRequest, NextResponse } from 'next/server'
import { verifySignedToken, ADMIN_COOKIE_NAME } from '@/lib/adminAuth'

// Paths that don't require an authenticated session
const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/login/verify', '/admin/setup']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))) {
    // Public paths always pass through — layout skips session check for these.
    const res = NextResponse.next()
    res.headers.set('x-pathname', pathname)
    return res
  }

  // All other /admin/* routes: verify the HMAC signature of the session cookie.
  // Full expiry + DB validation happens in the admin layout (Node runtime).
  const token = request.cookies.get(ADMIN_COOKIE_NAME)?.value
  if (!token || !(await verifySignedToken(token))) {
    const loginUrl = new URL('/admin/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  const res = NextResponse.next()
  res.headers.set('x-pathname', pathname)
  return res
}

export const config = {
  matcher: '/admin/:path*',
}
