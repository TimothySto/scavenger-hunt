import { z } from 'zod'

const checkpointTypeValues = [
  'ONSITE_SPONSOR',
  'OFFSITE_SPONSOR',
  'EXHIBIT',
  'EXHIBIT_QUESTION',
  'ONLINE_ONLY',
  'PRIZE_REDEMPTION',
  'EVENT_GENERAL',
] as const

export const checkpointImportSchema = z.object({
  name: z.string().min(1),
  slug: z.string().optional().nullable(),
  qrCodeValue: z.string().optional().nullable(),
  type: z.enum(checkpointTypeValues).optional().default('ONSITE_SPONSOR'),
  points: z.number().int().nonnegative(),
  clue: z.string().optional().nullable(),
  fallbackUrl: z.string().url().optional().nullable(),
  contentJson: z.record(z.string(), z.any()).optional().nullable(),
  isActive: z.boolean().optional(),
})

export const eventImportSchema = z.object({
  event: z.object({
    name: z.string().min(1),
    slug: z.string().min(1),
    description: z.string().optional().nullable(),
    logoUrl: z.string().optional().nullable(),
    isActive: z.boolean().optional(),
  }),
  checkpoints: z.array(checkpointImportSchema),
})

export type EventImportInput = z.infer<typeof eventImportSchema>