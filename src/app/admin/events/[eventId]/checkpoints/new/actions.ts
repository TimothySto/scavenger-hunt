'use server'

import { Prisma, CheckpointType } from '@prisma/client'
import { db } from '@/lib/db'
import { uniqueCheckpointSlug } from '@/lib/slug'
import { redirect } from 'next/navigation'

const VALID_CHECKPOINT_TYPES = new Set<string>([
  'ONSITE_SPONSOR', 'OFFSITE_SPONSOR', 'EXHIBIT', 'EXHIBIT_QUESTION',
  'ONLINE_ONLY', 'PRIZE_REDEMPTION', 'EVENT_GENERAL',
])

export async function createCheckpoint(eventId: string, formData: FormData) {
  const name      = String(formData.get('name')      ?? '').trim()
  const points    = Number(formData.get('points')    ?? 0)
  const clue      = String(formData.get('clue')      ?? '').trim() || null
  const fallbackUrl = String(formData.get('fallbackUrl') ?? '').trim() || null
  const typeRaw   = String(formData.get('type')      ?? '').trim()
  const isActive  = formData.get('isActive') === 'on'

  if (!name) throw new Error('Name is required.')
  if (!VALID_CHECKPOINT_TYPES.has(typeRaw)) throw new Error(`Invalid checkpoint type: ${typeRaw}`)
  const type = typeRaw as CheckpointType

  // ContentJson fields
  const sponsorLogo       = String(formData.get('sponsorLogo')       ?? '').trim() || null
  const backgroundImage   = String(formData.get('backgroundImage')   ?? '').trim() || null
  const blurb             = String(formData.get('blurb')             ?? '').trim() || null
  const prizeInstructions = String(formData.get('prizeInstructions') ?? '').trim() || null
  const question          = String(formData.get('question')          ?? '').trim() || null
  const correctAnswer     = String(formData.get('correctAnswer')     ?? '').trim() || null
  const answerChoicesRaw  = String(formData.get('answerChoices')     ?? '').trim()
  const answerChoices     = answerChoicesRaw
    ? answerChoicesRaw.split('\n').map((s) => s.trim()).filter(Boolean)
    : null
  const questionMode      = formData.get('questionMode') === 'true' ? true : null
  const showTagRaw        = formData.get('showTag')
  const showTag           = showTagRaw === 'false' ? false : null

  const contentFields = {
    sponsorLogo, backgroundImage, blurb, prizeInstructions,
    question, correctAnswer,
    ...(answerChoices && answerChoices.length > 0 ? { answerChoices } : {}),
    ...(questionMode ? { questionMode } : {}),
    ...(showTag === false ? { showTag } : {}),
  }
  const hasContent = Object.values(contentFields).some((v) => v !== null)
  const contentJson: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput = hasContent
    ? (Object.fromEntries(Object.entries(contentFields).filter(([, v]) => v !== null)) as Prisma.InputJsonValue)
    : Prisma.DbNull

  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event) throw new Error('Event not found.')

  const slug = await uniqueCheckpointSlug(eventId, name)
  const qrCodeValue = `/checkin/${event.slug}/${slug}`

  const checkpoint = await db.checkpoint.create({
    data: { eventId, name, slug, qrCodeValue, type, points, clue, fallbackUrl, contentJson, isActive },
  })

  redirect(`/admin/events/${eventId}/checkpoints/${checkpoint.id}`)
}
