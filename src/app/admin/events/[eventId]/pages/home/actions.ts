'use server'

import { db } from '@/lib/db'
import { parseEventStyle } from '@/lib/eventTheme'
import { revalidatePath } from 'next/cache'

export async function updateHomePage(eventId: string, formData: FormData) {
  const announcement       = String(formData.get('announcement')       ?? '').trim()
  const backgroundImage    = String(formData.get('backgroundImage')    ?? '').trim()
  const showRecoveryCode   = formData.get('showRecoveryCode') === 'true'
  const recoveryCodeTitle  = String(formData.get('recoveryCodeTitle')  ?? '').trim()
  const recoveryCodeSubtext = String(formData.get('recoveryCodeSubtext') ?? '').trim()

  const current = await db.event.findUnique({ where: { id: eventId } })
  const style = parseEventStyle(current?.styleJson ?? null)

  await db.event.update({
    where: { id: eventId },
    data: {
      styleJson: {
        ...style,
        homeAnnouncement: announcement,
        homeBackgroundImage: backgroundImage,
        showRecoveryCode,
        recoveryCodeTitle,
        recoveryCodeSubtext,
      },
    },
  })

  revalidatePath(`/admin/events/${eventId}/pages/home`)
  revalidatePath(`/event`)
}
