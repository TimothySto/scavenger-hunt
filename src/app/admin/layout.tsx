import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { logout } from './login/actions'
import { validateAndRefreshSession } from '@/lib/adminSession'
import { ADMIN_COOKIE_NAME } from '@/lib/adminAuth'

// Paths that bypass the full DB session check (already exempted by middleware)
const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/login/verify', '/admin/setup']

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers()
  const pathname = hdrs.get('x-pathname') ?? ''
  const isPublic = PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))

  if (!isPublic) {
    const jar = await cookies()
    const token = jar.get(ADMIN_COOKIE_NAME)?.value

    if (!token || !(await validateAndRefreshSession(token))) {
      // Session expired or invalid — send to login
      redirect('/admin/login')
    }
  }

  return (
    <>
      <header className="flex items-center justify-between px-6 py-3 border-b bg-white text-sm">
        <span className="font-semibold text-gray-700">Scavenger Hunt Admin</span>
        <div className="flex items-center gap-5">
          <Link href="/admin/settings" className="text-gray-500 hover:text-gray-900 transition-colors">
            Settings
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="text-gray-500 hover:text-gray-900 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      {children}
    </>
  )
}
