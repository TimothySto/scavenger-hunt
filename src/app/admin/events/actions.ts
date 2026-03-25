'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'

export async function toggleEventActive(formData: FormData) {
  const eventId  = formData.get('eventId')?.toString() ?? ''
  const current  = formData.get('current') === 'true'

  await db.event.update({
    where: { id: eventId },
    data:  { isActive: !current },
  })

  revalidatePath('/admin')
}

export async function deleteEvent(formData: FormData) {
  const eventId = formData.get('eventId')?.toString() ?? ''

  await db.event.delete({ where: { id: eventId } })

  revalidatePath('/admin')
  redirect('/admin?manage=1')
}
