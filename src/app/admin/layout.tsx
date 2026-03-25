import Link from 'next/link'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { logout } from './login/actions'
import { validateAndRefreshSession, getAccountFromSession } from '@/lib/adminSession'
import { ADMIN_COOKIE_NAME } from '@/lib/adminAuth'
import { db } from '@/lib/db'

// Paths that bypass the full DB session check (already exempted by middleware)
const PUBLIC_ADMIN_PATHS = ['/admin/login', '/admin/login/verify', '/admin/setup']

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const hdrs = await headers()
  const pathname = hdrs.get('x-pathname') ?? ''
  const isPublic = PUBLIC_ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))

  let accountEmail: string | null = null

  if (!isPublic) {
    const jar = await cookies()
    const token = jar.get(ADMIN_COOKIE_NAME)?.value

    if (!token || !(await validateAndRefreshSession(token))) {
      redirect('/admin/login')
    }

    const accountId = await getAccountFromSession(token)
    if (accountId) {
      const account = await db.adminAccount.findUnique({
        where: { id: accountId },
        select: { email: true },
      })
      accountEmail = account?.email ?? null
    }
  }

  return (
    <>
      <header className="flex items-center justify-between px-6 py-3 border-b bg-white text-sm">
        <Link href="/admin" className="font-semibold text-gray-700 hover:text-black transition-colors">
          Scavenger Hunt Admin
          {accountEmail && (
            <span className="ml-2 font-normal text-gray-400">— {accountEmail}</span>
          )}
        </Link>
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
