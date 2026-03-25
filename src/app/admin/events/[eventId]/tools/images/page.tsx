import { readdirSync } from 'fs'
import { join } from 'path'
import Link from 'next/link'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import ImageGrid from '@/app/admin/images/ImageGrid'

type PageProps = {
  params: Promise<{ eventId: string }>
}

function getEventImages(eventId: string) {
  const uploadDir = join(process.cwd(), 'public', 'uploads', eventId)
  try {
    return readdirSync(uploadDir)
      .filter((f) => !f.startsWith('.'))
      .map((filename) => ({ filename, url: `/uploads/${eventId}/${filename}` }))
      .reverse()
  } catch {
    return []
  }
}

export default async function EventImagesPage({ params }: PageProps) {
  const { eventId } = await params

  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event) notFound()

  const images = getEventImages(eventId)

  return (
    <main className="p-8 max-w-5xl">
      <div className="mb-6">
        <Link href={`/admin/events/${eventId}/tools`} className="text-sm text-gray-500 underline">
          ← Back to Tools
        </Link>
        <h1 className="text-2xl font-bold mt-2">Image Library</h1>
        <p className="text-sm text-gray-500 mt-1">{event.name}</p>
      </div>
      <ImageGrid initial={images} eventId={eventId} />
    </main>
  )
}
