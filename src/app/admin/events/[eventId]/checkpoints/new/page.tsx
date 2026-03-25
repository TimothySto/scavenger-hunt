import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { readdirSync } from 'fs'
import { join } from 'path'
import Link from 'next/link'
import CheckpointForm from './CheckpointForm'

type PageProps = {
  params: Promise<{ eventId: string }>
}

function getEventImages(eventId: string) {
  try {
    return readdirSync(join(process.cwd(), 'public', 'uploads', eventId))
      .filter((f) => !f.startsWith('.'))
      .map((filename) => ({ filename, url: `/uploads/${eventId}/${filename}` }))
      .reverse()
  } catch {
    return []
  }
}

export default async function NewCheckpointPage({ params }: PageProps) {
  const { eventId } = await params

  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event) notFound()

  const images = getEventImages(eventId)

  return (
    <main className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href={`/admin/events/${eventId}`} className="text-sm text-gray-500 underline">
          ← Back to {event.name}
        </Link>
        <h1 className="text-2xl font-bold mt-2">Create Checkpoint</h1>
      </div>
      <CheckpointForm eventId={eventId} eventSlug={event.slug} images={images} />
    </main>
  )
}
