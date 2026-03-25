'use server'

import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { hashPassword } from '@/lib/adminPassword'
import { isEmailAllowed } from '@/lib/adminWhitelist'

export async function createAccount(formData: FormData) {
  const email    = formData.get('email')?.toString().trim().toLowerCase() ?? ''
  const password = formData.get('password')?.toString() ?? ''
  const confirm  = formData.get('confirm')?.toString() ?? ''

  // Guard: only one account allowed, and only when none exist
  const count = await db.adminAccount.count()
  if (count > 0) {
    redirect('/admin/setup?error=exists')
  }

  if (!(await isEmailAllowed(email))) {
    redirect('/admin/setup?error=notallowed')
  }

  if (password.length < 8) {
    redirect('/admin/setup?error=short')
  }

  if (password !== confirm) {
    redirect('/admin/setup?error=mismatch')
  }

  const passwordHash = await hashPassword(password)

  await db.adminAccount.create({
    data: { email, passwordHash },
  })

  redirect('/admin/login')
}
