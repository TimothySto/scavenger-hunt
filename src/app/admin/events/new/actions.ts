'use server'

import { db } from '@/lib/db'
import { redirect } from 'next/navigation'

function toBoolean(value: FormDataEntryValue | null) {
  return value === 'on'
}

export async function createEvent(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const slug = String(formData.get('slug') ?? '').trim()
  const description = String(formData.get('description') ?? '').trim()
  const logoUrl = String(formData.get('logoUrl') ?? '').trim()
  const isActive = toBoolean(formData.get('isActive'))

  if (!name || !slug) {
    throw new Error('Name and slug are required.')
  }

  const event = await db.event.create({
    data: {
      name,
      slug,
      description: description || null,
      logoUrl: logoUrl || null,
      isActive,
    },
  })

  redirect(`/admin/events/${event.id}`)
}