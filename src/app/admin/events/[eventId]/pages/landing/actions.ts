'use server'

import { db } from '@/lib/db'
import { parseEventStyle } from '@/lib/eventTheme'
import { revalidatePath } from 'next/cache'

export async function updateLandingPage(eventId: string, formData: FormData) {
  const name        = String(formData.get('name')        ?? '').trim()
  const description = String(formData.get('description') ?? '').trim() || null
  const logoUrl     = String(formData.get('logoUrl')     ?? '').trim() || null
  const backgroundImage = String(formData.get('backgroundImage') ?? '').trim()
  const ctaText     = String(formData.get('ctaText')     ?? '').trim()
  const conversionBonusPoints = Math.max(0, Number(formData.get('conversionBonusPoints') ?? 0))

  if (!name) throw new Error('Event name is required.')

  const current = await db.event.findUnique({ where: { id: eventId } })
  const style = parseEventStyle(current?.styleJson ?? null)

  await db.event.update({
    where: { id: eventId },
    data: {
      name,
      description,
      logoUrl,
      conversionBonusPoints,
      styleJson: { ...style, landingBackgroundImage: backgroundImage, landingCtaText: ctaText },
    },
  })

  revalidatePath(`/admin/events/${eventId}/pages/landing`)
  revalidatePath(`/event`)
}
