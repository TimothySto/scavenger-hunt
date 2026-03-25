import { db } from '@/lib/db'
import { SESSION_COOKIE_NAME, createSessionId } from '@/lib/session'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function POST(req: Request) {
  const formData = await req.formData()

  const eventSlug = formData.get('eventSlug') as string | null
  const checkpointSlug = formData.get('checkpointSlug') as string | null

  if (!eventSlug || !checkpointSlug) {
    redirect('/?error=missing-fields')
  }

  const event = await db.event.findUnique({
    where: { slug: eventSlug },
  })

  if (!event) {
    redirect('/?error=event-not-found')
  }

  const checkpoint = await db.checkpoint.findFirst({
    where: {
      eventId: event.id,
      slug: checkpointSlug,
      isActive: true,
    },
  })

  if (!checkpoint) {
    redirect(`/checkin/${eventSlug}/${checkpointSlug}?status=checkpoint-not-found`)
  }

  const cookieStore = await cookies()
  let cookieId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!cookieId) {
    cookieId = createSessionId()

    cookieStore.set(SESSION_COOKIE_NAME, cookieId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30, // 30 days
    })
  }

  const participantSession = await db.participantSession.upsert({
    where: {
      eventId_cookieId: {
        eventId: event.id,
        cookieId,
      },
    },
    update: {},
    create: {
      eventId: event.id,
      cookieId,
    },
  })

  try {
    await db.checkIn.create({
      data: {
        participantSessionId: participantSession.id,
        checkpointId: checkpoint.id,
      },
    })

    redirect(`/checkin/${eventSlug}/${checkpointSlug}?status=success`)
  } catch (error) {
    const isDuplicate =
      error instanceof Error &&
      'code' in error &&
      (error as { code?: string }).code === 'P2002'

    if (isDuplicate) {
      redirect(`/checkin/${eventSlug}/${checkpointSlug}?status=already-checked-in`)
    }

    throw error
  }
}