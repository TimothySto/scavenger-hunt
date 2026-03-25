'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/adminPassword'
import { getAccountFromSession } from '@/lib/adminSession'
import { ADMIN_COOKIE_NAME } from '@/lib/adminAuth'

async function getCurrentAccount() {
  const jar = await cookies()
  const token = jar.get(ADMIN_COOKIE_NAME)?.value ?? ''
  const accountId = await getAccountFromSession(token)
  if (!accountId) return null
  return db.adminAccount.findUnique({ where: { id: accountId } })
}

export async function changePassword(formData: FormData) {
  const current = formData.get('current')?.toString() ?? ''
  const next    = formData.get('next')?.toString() ?? ''
  const confirm = formData.get('confirm')?.toString() ?? ''

  if (next.length < 8) redirect('/admin/settings?error=short')
  if (next !== confirm) redirect('/admin/settings?error=mismatch')

  const account = await getCurrentAccount()
  if (!account) redirect('/admin/login')

  if (!(await verifyPassword(current, account.passwordHash))) {
    redirect('/admin/settings?error=wrong')
  }

  const passwordHash = await hashPassword(next)
  await db.adminAccount.update({
    where: { id: account.id },
    data: { passwordHash },
  })

  redirect('/admin/settings?success=password')
}

export async function changeEmail(formData: FormData) {
  const newEmail = formData.get('newEmail')?.toString().trim().toLowerCase() ?? ''
  const password = formData.get('password')?.toString() ?? ''

  const account = await getCurrentAccount()
  if (!account) redirect('/admin/login')

  if (newEmail === account.email) redirect('/admin/settings?error=same')

  if (!(await verifyPassword(password, account.passwordHash))) {
    redirect('/admin/settings?error=wrong')
  }

  // Check uniqueness
  const existing = await db.adminAccount.findUnique({ where: { email: newEmail } })
  if (existing) redirect('/admin/settings?error=taken')

  await db.adminAccount.update({
    where: { id: account.id },
    data: { email: newEmail },
  })

  redirect('/admin/settings?success=email')
}
