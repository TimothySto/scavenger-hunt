import Link from 'next/link'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { CheckpointReorderList } from './CheckpointReorderList'

type PageProps = {
  params: Promise<{
    eventId: string
  }>
}

export default async function AdminEventDetailPage({ params }: PageProps) {
  const { eventId } = await params

  const event = await db.event.findUnique({
    where: { id: eventId },
    include: {
      checkpoints: {
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!event) notFound()

  return (
    <main className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-2">{event.name}</h1>
      <p className="text-sm text-gray-600 mb-2">{event.slug}</p>
      {event.description && <p className="mb-4">{event.description}</p>}

      <div className="flex gap-4 mb-8">
        <Link
          href="/admin/import"
          className="rounded border px-4 py-2"
        >
          Import JSON
        </Link>

        <Link
          href={`/admin/events/${event.id}/qr-sheet`}
          className="rounded border px-4 py-2"
        >
          Print QR Sheet
        </Link>

        <Link
          href={`/admin/events/${event.id}/dashboard/checkpoints`}
          className="rounded border px-4 py-2"
        >
          Checkpoint Dashboard
        </Link>

        <Link
          href={`/admin/events/${event.id}/dashboard/hunters`}
          className="rounded border px-4 py-2"
        >
          Hunter Dashboard
        </Link>

        <Link
          href={`/admin/events/${event.id}/dashboard/redemptions`}
          className="rounded border px-4 py-2"
        >
          Redemptions
        </Link>

        <Link
          href={`/admin/events/${event.id}/dashboard/conversions`}
          className="rounded border px-4 py-2"
        >
          Conversions
        </Link>

        <Link
          href={`/admin/events/${event.id}/tools`}
          className="rounded border px-4 py-2 border-amber-400 text-amber-700 hover:bg-amber-50"
        >
          Admin Tools
        </Link>
      </div>

      {/* Event pages */}
      <h2 className="text-lg font-semibold mb-2">Event</h2>
      <div className="space-y-2 mb-8">
        {[
          { label: 'Landing Page',  href: `/admin/events/${event.id}/pages/landing`,  sub: `/event/${event.slug}` },
          { label: 'Welcome Page',  href: `/admin/events/${event.id}/pages/welcome`,  sub: `/event/${event.slug}/welcome` },
          { label: 'Homepage',      href: `/admin/events/${event.id}/pages/home`,     sub: `/event/${event.slug}/home` },
        ].map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 hover:border-black transition-colors group"
          >
            <div>
              <span className="font-medium group-hover:underline">{page.label}</span>
              <span className="ml-3 text-xs text-gray-400 font-mono">{page.sub}</span>
            </div>
            <span className="text-sm text-gray-400">Edit →</span>
          </Link>
        ))}
      </div>

      {/* Checkpoints */}
      <h2 className="text-lg font-semibold mb-2">
        Checkpoints
        <span className="ml-2 text-sm font-normal text-gray-400">({event.checkpoints.length})</span>
      </h2>
      <CheckpointReorderList
        checkpoints={event.checkpoints.map((cp) => ({
          id: cp.id,
          name: cp.name,
          type: cp.type,
          points: cp.points,
          isActive: cp.isActive,
          customTag: (cp.contentJson as Record<string, unknown> | null)?.customTag as string | null ?? null,
        }))}
        eventId={event.id}
      />

      <div className="mt-2">
        <Link
          href={`/admin/events/${event.id}/checkpoints/new`}
          className="flex items-center justify-between rounded-lg border-2 border-cyan-300 bg-cyan-50 px-4 py-3 hover:border-cyan-500 hover:bg-cyan-100 transition-colors group"
        >
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full flex-shrink-0 bg-cyan-300" />
            <span className="font-medium text-cyan-700 group-hover:underline">Add Checkpoint</span>
          </div>
          <span className="text-sm text-cyan-500">+ New →</span>
        </Link>
      </div>
    </main>
  )
}