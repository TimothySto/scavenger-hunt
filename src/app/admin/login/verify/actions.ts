'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { verifyPendingCode, createAdminSession } from '@/lib/adminSession'
import { ADMIN_COOKIE_NAME, PENDING_COOKIE_NAME, SESSION_DURATION_MS } from '@/lib/adminAuth'

export async function verifyOtp(formData: FormData) {
  const code = formData.get('code')?.toString().trim() ?? ''
  const from = formData.get('from')?.toString() ?? '/admin'

  const jar = await cookies()
  const pendingToken = jar.get(PENDING_COOKIE_NAME)?.value

  if (!pendingToken) {
    // No pending session — either expired or never started
    redirect('/admin/login/verify?error=expired')
  }

  const accountId = await verifyPendingCode(pendingToken, code)
  if (!accountId) {
    redirect(`/admin/login/verify?error=invalid&from=${encodeURIComponent(from)}`)
  }

  // OTP verified — create a real session
  const sessionToken = await createAdminSession(accountId)

  jar.delete(PENDING_COOKIE_NAME)
  jar.set(ADMIN_COOKIE_NAME, sessionToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_DURATION_MS / 1000,
    secure: process.env.NODE_ENV === 'production',
  })

  redirect(from.startsWith('/admin') ? from : '/admin')
}
