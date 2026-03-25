'use server'

import { db } from '@/lib/db'
import { SESSION_COOKIE_NAME } from '@/lib/session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function reclaimSession(eventSlug: string, sessionId: string) {
  const session = await db.participantSession.findUnique({
    where: { id: sessionId },
    include: { event: { select: { slug: true } } },
  })

  // Verify this session belongs to the correct event
  if (!session || session.event.slug !== eventSlug) {
    redirect(`/event/${eventSlug}`)
  }

  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE_NAME, session.cookieId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  })

  redirect(`/event/${eventSlug}/home`)
}
