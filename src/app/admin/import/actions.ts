'use server'

import { db } from '@/lib/db'
import { eventImportSchema } from '@/lib/validation'
import { uniqueCheckpointSlug } from '@/lib/slug'
import { redirect } from 'next/navigation'
import { Prisma, CheckpointType } from '@prisma/client'

export async function importEventJson(formData: FormData) {
  const rawJson = String(formData.get('json') ?? '').trim()

  if (!rawJson) {
    throw new Error('JSON input is required.')
  }

  const parsed = JSON.parse(rawJson)
  const result = eventImportSchema.parse(parsed)

  const event = await db.event.upsert({
    where: { slug: result.event.slug },
    update: {
      name: result.event.name,
      description: result.event.description ?? null,
      logoUrl: result.event.logoUrl ?? null,
      isActive: result.event.isActive ?? true,
    },
    create: {
      name: result.event.name,
      slug: result.event.slug,
      description: result.event.description ?? null,
      logoUrl: result.event.logoUrl ?? null,
      isActive: result.event.isActive ?? true,
    },
  })

  for (const checkpoint of result.checkpoints) {
    const slug = checkpoint.slug || await uniqueCheckpointSlug(event.id, checkpoint.name)
    const qrCodeValue = checkpoint.qrCodeValue || `/checkin/${result.event.slug}/${slug}`

    await db.checkpoint.upsert({
      where: { qrCodeValue },
      update: {
        name: checkpoint.name,
        slug,
        type: checkpoint.type as CheckpointType,
        points: checkpoint.points,
        clue: checkpoint.clue ?? null,
        fallbackUrl: checkpoint.fallbackUrl ?? null,
        contentJson: checkpoint.contentJson ?? Prisma.DbNull,
        isActive: checkpoint.isActive ?? true,
        eventId: event.id,
      },
      create: {
        eventId: event.id,
        name: checkpoint.name,
        slug,
        qrCodeValue,
        type: checkpoint.type as CheckpointType,
        points: checkpoint.points,
        clue: checkpoint.clue ?? null,
        fallbackUrl: checkpoint.fallbackUrl ?? null,
        contentJson: checkpoint.contentJson ?? Prisma.DbNull,
        isActive: checkpoint.isActive ?? true,
      },
    })
  }

  redirect(`/admin/events/${event.id}`)
}