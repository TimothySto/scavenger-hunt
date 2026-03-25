'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function addScoreAdjustment(
  sessionId: string,
  eventId: string,
  formData: FormData
) {
  const rawPoints = Number(formData.get('points') ?? '0')
  const reason = String(formData.get('reason') ?? '').trim() || null

  if (!Number.isFinite(rawPoints) || rawPoints === 0) {
    throw new Error('Points must be a non-zero number.')
  }

  await db.manualPointAdjustment.create({
    data: { sessionId, points: rawPoints, reason },
  })

  revalidatePath(`/admin/events/${eventId}/tools/recovery`)
}
