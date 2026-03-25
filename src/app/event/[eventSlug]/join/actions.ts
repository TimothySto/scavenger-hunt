'use server'

import { db } from '@/lib/db'
import { SESSION_COOKIE_NAME, createSessionId } from '@/lib/session'
import { parseEventStyle } from '@/lib/eventTheme'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function joinHunt(eventId: string, eventSlug: string, next: string | null, formData: FormData) {
  const displayName = String(formData.get('displayName') ?? '').trim() || null

  const cookieStore = await cookies()
  let cookieId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!cookieId) {
    cookieId = createSessionId()
    cookieStore.set(SESSION_COOKIE_NAME, cookieId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    })
  }

  await db.participantSession.upsert({
    where: { eventId_cookieId: { eventId, cookieId } },
    update: { displayName },
    create: { eventId, cookieId, displayName },
  })

  if (next) {
    redirect(next)
  }

  const event = await db.event.findUnique({ where: { id: eventId }, select: { styleJson: true } })
  const style = parseEventStyle(event?.styleJson ?? null)
  redirect(style.showWelcomePage ? `/event/${eventSlug}/welcome` : `/event/${eventSlug}/home`)
}
