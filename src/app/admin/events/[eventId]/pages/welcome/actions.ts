'use server'

import { db } from '@/lib/db'
import { parseEventStyle } from '@/lib/eventTheme'
import { revalidatePath } from 'next/cache'

export async function updateWelcomePage(eventId: string, formData: FormData) {
  const showWelcomePage        = formData.get('showWelcomePage') === 'true'
  const welcomeBackgroundImage = String(formData.get('welcomeBackgroundImage') ?? '').trim()
  const welcomeRulesText       = String(formData.get('welcomeRulesText') ?? '').trim()
  const welcomeCtaText         = String(formData.get('welcomeCtaText')   ?? '').trim()

  const current = await db.event.findUnique({ where: { id: eventId } })
  const style = parseEventStyle(current?.styleJson ?? null)

  await db.event.update({
    where: { id: eventId },
    data: {
      styleJson: {
        ...style,
        showWelcomePage,
        welcomeBackgroundImage,
        welcomeRulesText,
        welcomeCtaText,
      },
    },
  })

  revalidatePath(`/admin/events/${eventId}/pages/welcome`)
  revalidatePath(`/event`)
}
