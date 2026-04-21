'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { verifyPassword } from '@/lib/adminPassword'
import { createPendingCode, deleteAdminSession } from '@/lib/adminSession'
import { sendOtpEmail } from '@/lib/email'
import { ADMIN_COOKIE_NAME, PENDING_COOKIE_NAME } from '@/lib/adminAuth'

export async function login(formData: FormData) {
  const email    = formData.get('email')?.toString().trim().toLowerCase() ?? ''
  const password = formData.get('password')?.toString() ?? ''
  const from     = formData.get('from')?.toString() ?? '/admin'

  // Look up account by email
  const account = await db.adminAccount.findUnique({ where: { email } })
  if (!account || !(await verifyPassword(password, account.passwordHash))) {
    redirect(`/admin/login?error=credentials&from=${encodeURIComponent(from)}`)
  }

  // Generate OTP and send email
  const { pendingToken, plainCode } = await createPendingCode(account.id)

  try {
    await sendOtpEmail(account.email, plainCode)
  } catch (err) {
    console.error('[SMTP error]', err)
    redirect(`/admin/login?error=send&from=${encodeURIComponent(from)}`)
  }

  // Store the pending token in a short-lived cookie
  const jar = await cookies()
  jar.set(PENDING_COOKIE_NAME, pendingToken, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 10 * 60, // 10 minutes — matches OTP expiry
    secure: process.env.NODE_ENV === 'production',
  })

  redirect(`/admin/login/verify?from=${encodeURIComponent(from)}`)
}

export async function logout() {
  const jar = await cookies()
  const token = jar.get(ADMIN_COOKIE_NAME)?.value
  if (token) {
    await deleteAdminSession(token).catch(() => {})
  }
  jar.delete(ADMIN_COOKIE_NAME)
  jar.delete(PENDING_COOKIE_NAME)
  redirect('/admin/login')
}
