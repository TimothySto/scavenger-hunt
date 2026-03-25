'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function setCheckpointActive(checkpointId: string, isActive: boolean) {
  const checkpoint = await db.checkpoint.update({
    where: { id: checkpointId },
    data: { isActive },
    select: { eventId: true },
  })
  revalidatePath(`/admin/events/${checkpoint.eventId}/dashboard/checkpoints`)
}

export async function setHunterEnabled(sessionId: string, isEnabled: boolean) {
  const session = await db.participantSession.update({
    where: { id: sessionId },
    data: { isEnabled },
    select: { eventId: true },
  })
  revalidatePath(`/admin/events/${session.eventId}/dashboard/hunters`)
}

export async function deleteSession(sessionId: string) {
  const session = await db.participantSession.delete({
    where: { id: sessionId },
    select: { eventId: true },
  })
  revalidatePath(`/admin/events/${session.eventId}/dashboard/hunters`)
}
