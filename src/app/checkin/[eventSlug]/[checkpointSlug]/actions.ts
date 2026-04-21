'use server'

import { db } from '@/lib/db'
import { SESSION_COOKIE_NAME } from '@/lib/session'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'

export type CheckinStatus = 'ok' | 'already-checked-in' | 'disabled' | 'no-session' | 'hunt-ended' | 'error'
export type CompleteStatus = 'ok' | 'already-completed' | 'no-session'
export type ConversionKind = 'AUTO' | 'MANUAL'
export type AnswerStatus = 'correct' | 'already-correct' | 'incorrect' | 'no-session' | 'disabled' | 'hunt-ended'

export async function recordCheckin(
  eventId: string,
  checkpointId: string
): Promise<CheckinStatus> {
  const cookieStore = await cookies()
  const cookieId = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!cookieId) return 'no-session'

  const session = await db.participantSession.findUnique({
    where: { eventId_cookieId: { eventId, cookieId } },
  })
  if (!session) return 'no-session'

  if (!session.isEnabled) return 'disabled'
  if (session.completedAt) return 'hunt-ended'

  try {
    await db.checkIn.create({
      data: { participantSessionId: session.id, checkpointId },
    })
    return 'ok'
  } catch (err) {
    const isDuplicate =
      err instanceof Error &&
      'code' in err &&
      (err as { code?: string }).code === 'P2002'
    return isDuplicate ? 'already-checked-in' : 'error'
  }
}

export async function recordConversion(
  eventId: string,
  checkpointId: string,
  type: ConversionKind
): Promise<void> {
  const cookieStore = await cookies()
  const cookieId = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!cookieId) return

  const session = await db.participantSession.findUnique({
    where: { eventId_cookieId: { eventId, cookieId } },
  })
  if (!session) return

  // Each (session, checkpoint, type) pair is recorded at most once
  const existing = await db.checkpointConversion.findFirst({
    where: { sessionId: session.id, checkpointId, type },
  })
  if (existing) return

  await db.checkpointConversion.create({
    data: { sessionId: session.id, checkpointId, type },
  })

  // Award bonus on the first-ever MANUAL conversion for this session+checkpoint
  if (type === 'MANUAL') {
    const event = await db.event.findUnique({ where: { id: eventId } })
    if (event && event.conversionBonusPoints > 0) {
      await db.manualPointAdjustment.create({
        data: {
          sessionId: session.id,
          points: event.conversionBonusPoints,
          reason: 'Conversion bonus',
        },
      })
      // Bust the participant homepage cache so the updated score is shown on return
      revalidatePath(`/event/${event.slug}/home`)
    }
  }
}

export async function submitAnswer(
  eventId: string,
  checkpointId: string,
  answer: string,
  correctAnswer: string,
  acceptedAnswers: string[] = []
): Promise<AnswerStatus> {
  const cookieStore = await cookies()
  const cookieId = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!cookieId) return 'no-session'

  const session = await db.participantSession.findUnique({
    where: { eventId_cookieId: { eventId, cookieId } },
  })
  if (!session) return 'no-session'
  if (!session.isEnabled) return 'disabled'
  if (session.completedAt) return 'hunt-ended'

  const normalize = (s: string) => s.trim().toLowerCase()
  const normalizedAnswer = normalize(answer)
  const allAccepted = [correctAnswer, ...acceptedAnswers]
  if (!allAccepted.some((a) => normalize(a) === normalizedAnswer)) return 'incorrect'

  try {
    await db.checkIn.create({
      data: { participantSessionId: session.id, checkpointId },
    })
    return 'correct'
  } catch (err) {
    const isDuplicate =
      err instanceof Error && 'code' in err && (err as { code?: string }).code === 'P2002'
    return isDuplicate ? 'already-correct' : 'incorrect'
  }
}

export async function completeHunt(
  eventId: string,
  checkpointId: string,
  checkpointPoints: number
): Promise<CompleteStatus> {
  const cookieStore = await cookies()
  const cookieId = cookieStore.get(SESSION_COOKIE_NAME)?.value
  if (!cookieId) return 'no-session'

  const session = await db.participantSession.findUnique({
    where: { eventId_cookieId: { eventId, cookieId } },
  })

  if (!session) return 'no-session'
  if (session.completedAt) return 'already-completed'

  await db.participantSession.update({
    where: { id: session.id },
    data: { completedAt: new Date() },
  })

  if (checkpointPoints > 0) {
    try {
      await db.checkIn.create({
        data: { participantSessionId: session.id, checkpointId },
      })
    } catch {
      // P2002 duplicate — points already granted, ignore
    }
  }

  return 'ok'
}
