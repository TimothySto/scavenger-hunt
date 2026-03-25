'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { hashPassword, verifyPassword } from '@/lib/adminPassword'
import { getAccountFromSession } from '@/lib/adminSession'
import { ADMIN_COOKIE_NAME } from '@/lib/adminAuth'
import { addToWhitelist, removeFromWhitelist } from '@/lib/adminWhitelist'
import { revalidatePath } from 'next/cache'

async function getCurrentAccount() {
  const jar = await cookies()
  const token = jar.get(ADMIN_COOKIE_NAME)?.value ?? ''
  const accountId = await getAccountFromSession(token)
  if (!accountId) return null
  return db.adminAccount.findUnique({ where: { id: accountId } })
}

// ── Own credentials ────────────────────────────────────────────────────────

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
  await db.adminAccount.update({ where: { id: account.id }, data: { passwordHash } })

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

  const existing = await db.adminAccount.findUnique({ where: { email: newEmail } })
  if (existing) redirect('/admin/settings?error=taken')

  await db.adminAccount.update({ where: { id: account.id }, data: { email: newEmail } })

  // Keep whitelist in sync with the renamed email
  await removeFromWhitelist(account.email)
  await addToWhitelist(newEmail)

  redirect('/admin/settings?success=email')
}

// ── Admin account management ───────────────────────────────────────────────

export async function addAdminAccount(formData: FormData) {
  const caller = await getCurrentAccount()
  if (!caller) redirect('/admin/login')

  const email    = formData.get('email')?.toString().trim().toLowerCase() ?? ''
  const password = formData.get('password')?.toString() ?? ''
  const confirm  = formData.get('confirm')?.toString() ?? ''

  if (password.length < 8) redirect('/admin/settings?error=addshort')
  if (password !== confirm)  redirect('/admin/settings?error=addmismatch')

  const existing = await db.adminAccount.findUnique({ where: { email } })
  if (existing) redirect('/admin/settings?error=addtaken')

  const passwordHash = await hashPassword(password)
  await db.adminAccount.create({ data: { email, passwordHash } })

  // Add to whitelist so the new account can always log back in
  await addToWhitelist(email)

  revalidatePath('/admin/settings')
  redirect('/admin/settings?success=addadmin')
}

export async function removeAdminAccount(formData: FormData) {
  const caller = await getCurrentAccount()
  if (!caller) redirect('/admin/login')

  const targetId = formData.get('targetId')?.toString() ?? ''

  // Prevent self-removal
  if (targetId === caller.id) redirect('/admin/settings?error=removeself')

  const target = await db.adminAccount.findUnique({ where: { id: targetId } })
  if (!target) redirect('/admin/settings?error=notfound')

  await db.adminAccount.delete({ where: { id: targetId } })

  // Remove from whitelist
  await removeFromWhitelist(target.email)

  revalidatePath('/admin/settings')
  redirect('/admin/settings?success=removeadmin')
}
