'use server'

import { randomBytes } from 'crypto'
import { db } from '@/lib/db'
import { CheckpointType, Prisma } from '@prisma/client'
import { revalidatePath } from 'next/cache'

function generateObscuredSlug(): string {
  // 10-char lowercase hex — unguessable, URL-safe, e.g. "a3f7c291b4"
  return randomBytes(5).toString('hex')
}

async function revalidateCheckpointPaths(checkpointId: string, eventId: string) {
  revalidatePath(`/admin/events/${eventId}/checkpoints/${checkpointId}`)
  const event = await db.event.findUnique({ where: { id: eventId }, select: { slug: true } })
  if (event) revalidatePath(`/event/${event.slug}/home`)
}

export async function obscureCheckpointUrl(checkpointId: string, eventId: string) {
  const checkpoint = await db.checkpoint.findUnique({
    where: { id: checkpointId },
    include: { event: { select: { slug: true } } },
  })
  if (!checkpoint) return

  const obscuredSlug  = generateObscuredSlug()
  const qrCodeValue   = `/checkin/${checkpoint.event.slug}/${obscuredSlug}`
  const currentContent = (checkpoint.contentJson as Record<string, unknown>) ?? {}

  await db.checkpoint.update({
    where: { id: checkpointId },
    data: {
      slug: obscuredSlug,
      qrCodeValue,
      contentJson: {
        ...currentContent,
        // Preserve the original readable slug so restore works
        originalSlug: (currentContent.originalSlug as string) ?? checkpoint.slug,
        isObscured: true,
      } as Prisma.InputJsonValue,
    },
  })

  await revalidateCheckpointPaths(checkpointId, eventId)
}

export async function restoreCheckpointUrl(checkpointId: string, eventId: string) {
  const checkpoint = await db.checkpoint.findUnique({
    where: { id: checkpointId },
    include: { event: { select: { slug: true } } },
  })
  if (!checkpoint) return

  const content      = (checkpoint.contentJson as Record<string, unknown>) ?? {}
  const originalSlug = content.originalSlug as string | undefined
  if (!originalSlug) return

  const qrCodeValue = `/checkin/${checkpoint.event.slug}/${originalSlug}`
  // Strip the obscuration keys, keep everything else
  const { originalSlug: _os, isObscured: _io, ...restContent } = content

  await db.checkpoint.update({
    where: { id: checkpointId },
    data: {
      slug: originalSlug,
      qrCodeValue,
      contentJson: Object.keys(restContent).length > 0
        ? (restContent as Prisma.InputJsonValue)
        : Prisma.DbNull,
    },
  })

  await revalidateCheckpointPaths(checkpointId, eventId)
}

const VALID_CHECKPOINT_TYPES = new Set<string>([
  'ONSITE_SPONSOR', 'OFFSITE_SPONSOR', 'EXHIBIT', 'EXHIBIT_QUESTION',
  'ONLINE_ONLY', 'PRIZE_REDEMPTION', 'EVENT_GENERAL',
])

export async function updateCheckpoint(checkpointId: string, eventId: string, formData: FormData) {
  const name = String(formData.get('name') ?? '').trim()
  const points = Number(formData.get('points') ?? 0)
  const clue = String(formData.get('clue') ?? '').trim() || null
  const fallbackUrl = String(formData.get('fallbackUrl') ?? '').trim() || null
  const typeRaw = String(formData.get('type') ?? '')
  const isActive = formData.get('isActive') === 'on'

  const type = VALID_CHECKPOINT_TYPES.has(typeRaw) ? (typeRaw as CheckpointType) : undefined

  // ContentJson fields
  const sponsorLogo        = String(formData.get('sponsorLogo')        ?? '').trim() || null
  const backgroundImage    = String(formData.get('backgroundImage')    ?? '').trim() || null
  const blurb              = String(formData.get('blurb')              ?? '').trim() || null
  const prizeInstructions  = String(formData.get('prizeInstructions')  ?? '').trim() || null
  const question           = String(formData.get('question')           ?? '').trim() || null
  const correctAnswer      = String(formData.get('correctAnswer')      ?? '').trim() || null
  const customTag          = String(formData.get('customTag')          ?? '').trim() || null
  const answerChoicesRaw   = String(formData.get('answerChoices')      ?? '').trim()
  const answerChoices      = answerChoicesRaw
    ? answerChoicesRaw.split('\n').map((s) => s.trim()).filter(Boolean)
    : null
  const acceptedAnswersRaw = String(formData.get('acceptedAnswers')    ?? '').trim()
  const acceptedAnswers    = acceptedAnswersRaw
    ? acceptedAnswersRaw.split('\n').map((s) => s.trim()).filter(Boolean)
    : null
  const questionMode       = formData.get('questionMode') === 'true' ? true : null
  const enableQuestion     = formData.get('enableQuestion') === 'true' ? true : null
  // showTag defaults to true — only store false explicitly so the absence means "show"
  const showTagRaw         = formData.get('showTag')
  const showTag            = showTagRaw === 'false' ? false : null

  const contentFields = {
    sponsorLogo, backgroundImage, blurb, prizeInstructions,
    question, correctAnswer, customTag,
    ...(answerChoices && answerChoices.length > 0 ? { answerChoices } : {}),
    ...(acceptedAnswers && acceptedAnswers.length > 0 ? { acceptedAnswers } : {}),
    ...(questionMode ? { questionMode } : {}),
    ...(enableQuestion ? { enableQuestion } : {}),
    ...(showTag === false ? { showTag } : {}),
  }
  const hasContent = Object.values(contentFields).some((v) => v !== null)
  const contentJson: Prisma.InputJsonValue | Prisma.NullableJsonNullValueInput = hasContent
    ? (Object.fromEntries(Object.entries(contentFields).filter(([, v]) => v !== null)) as Prisma.InputJsonValue)
    : Prisma.DbNull

  await db.checkpoint.update({
    where: { id: checkpointId },
    data: {
      ...(name && { name }),
      ...(type && { type }),
      points,
      clue,
      fallbackUrl,
      isActive,
      contentJson,
    },
  })

  revalidatePath(`/admin/events/${eventId}/checkpoints/${checkpointId}`)

  // Also revalidate the participant-facing pages so tag/type changes appear immediately
  const event = await db.event.findUnique({ where: { id: eventId }, select: { slug: true } })
  if (event) {
    revalidatePath(`/event/${event.slug}/home`)
    revalidatePath(`/event/${event.slug}/welcome`)
  }
}
