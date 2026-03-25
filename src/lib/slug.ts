import { db } from './db'

export function toSlug(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

/** Returns a slug that is unique within the given event, appending -2, -3, … as needed. */
export async function uniqueCheckpointSlug(eventId: string, name: string): Promise<string> {
  const base = toSlug(name) || 'checkpoint'
  let candidate = base
  let counter = 2
  while (true) {
    const existing = await db.checkpoint.findUnique({
      where: { eventId_slug: { eventId, slug: candidate } },
    })
    if (!existing) return candidate
    candidate = `${base}-${counter++}`
  }
}
