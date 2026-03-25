import Link from 'next/link'
import { db } from '@/lib/db'

export default async function AdminPage() {
  const events = await db.event.findMany({
    include: {
      checkpoints: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  })

  return (
    <main className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="flex gap-4 mb-8">
        <Link
          href="/admin/events/new"
          className="rounded bg-black px-4 py-2 text-white"
        >
          New Event
        </Link>

        <Link
          href="/admin/import"
          className="rounded border px-4 py-2"
        >
          Import JSON
        </Link>
      </div>

      <div className="space-y-4">
        {events.length === 0 ? (
          <p>No events yet.</p>
        ) : (
          events.map((event) => (
            <div key={event.id} className="rounded border p-4">
              <h2 className="text-lg font-semibold">{event.name}</h2>
              <p className="text-sm text-gray-600 mb-2">{event.slug}</p>
              <p className="text-sm mb-2">
                Checkpoints: {event.checkpoints.length}
              </p>

              <div className="flex gap-4 text-sm">
                <Link
                  href={`/admin/events/${event.id}`}
                  className="underline"
                >
                  Manage event
                </Link>

                <Link
                  href={`/event/${event.slug}/home`}
                  className="underline"
                >
                  View hunt page
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  )
}