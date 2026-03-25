'use server'

import { db } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { DEFAULT_TEXT_ELEMENTS, parseEventStyle } from '@/lib/eventTheme'

export async function updateEventBranding(eventId: string, formData: FormData) {
  // Read current style so page-content fields are preserved
  const current = await db.event.findUnique({ where: { id: eventId } })
  const currentStyle = parseEventStyle(current?.styleJson ?? null)
  const name        = String(formData.get('name')        ?? '').trim()
  const description = String(formData.get('description') ?? '').trim() || null
  const logoUrl     = String(formData.get('logoUrl')     ?? '').trim() || null

  const fontFamily      = String(formData.get('fontFamily')      ?? 'Inter').trim()
  const fontBold        = formData.get('fontBold')        === 'true'
  const fontItalic      = formData.get('fontItalic')      === 'true'
  const primaryColor    = String(formData.get('primaryColor')    ?? '#111827').trim()
  const primaryAlpha    = Number(formData.get('primaryAlpha')    ?? 100)
  const accentColor     = String(formData.get('accentColor')     ?? '#f59e0b').trim()
  const accentAlpha     = Number(formData.get('accentAlpha')     ?? 100)
  const backgroundColor = String(formData.get('backgroundColor') ?? '#f9fafb').trim()
  const backgroundAlpha = Number(formData.get('backgroundAlpha') ?? 100)

  // Text elements arrive as a single JSON blob from the client
  let textElements = DEFAULT_TEXT_ELEMENTS
  try {
    const raw = String(formData.get('textElementsJson') ?? '{}')
    textElements = { ...DEFAULT_TEXT_ELEMENTS, ...JSON.parse(raw) }
  } catch { /* keep defaults */ }

  if (!name) throw new Error('Event name is required.')

  const adminFontFamily  = String(formData.get('adminFontFamily')  ?? 'Inter').trim()
  const adminAccentColor = String(formData.get('adminAccentColor') ?? '#111827').trim()

  const styleJson = {
    fontFamily, fontBold, fontItalic,
    primaryColor, primaryAlpha,
    accentColor, accentAlpha,
    backgroundColor, backgroundAlpha,
    textElements,
    adminFontFamily,
    adminAccentColor,
    // Preserve page-content fields set by the page editors
    landingBackgroundImage: currentStyle.landingBackgroundImage,
    landingCtaText:         currentStyle.landingCtaText,
    homeAnnouncement:       currentStyle.homeAnnouncement,
    homeBackgroundImage:    currentStyle.homeBackgroundImage,
  }

  await db.event.update({
    where: { id: eventId },
    data: { name, description, logoUrl, styleJson },
  })

  revalidatePath(`/admin/events/${eventId}/tools/branding`)
  revalidatePath(`/admin/events/${eventId}`)
  redirect(`/admin/events/${eventId}/tools/branding`)
}
