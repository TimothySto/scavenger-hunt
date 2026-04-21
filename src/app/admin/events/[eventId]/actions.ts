'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function reorderCheckpoints(eventId: string, orderedIds: string[]) {
  await db.$transaction(
    orderedIds.map((id, index) =>
      db.checkpoint.update({ where: { id }, data: { order: index } })
    )
  )
  revalidatePath(`/admin/events/${eventId}`)
}
