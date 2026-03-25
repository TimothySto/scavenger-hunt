import Link from 'next/link'
import { db } from '@/lib/db'
import { toggleEventActive } from './events/actions'
import { DeleteEventButton } from './DeleteEventButton'

type Props = {
  searchParams: Promise<{ manage?: string }>
}

export default async function AdminPage({ searchParams }: Props) {
  const { manage } = await searchParams
  const isManaging = manage === '1'

  const events = await db.event.findMany({
    include: { checkpoints: { select: { id: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {/* ── Action bar ──────────────────────────────────────────── */}
      <div className="flex gap-3 mb-8">
        <Link href="/admin/events/new" className="rounded bg-black px-4 py-2 text-sm text-white font-medium hover:bg-gray-800 transition-colors">
          New Event
        </Link>
        <Link href="/admin/import" className="rounded border px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors">
          Import JSON
        </Link>
        {events.length > 0 && (
          isManaging ? (
            <Link href="/admin" className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors ml-auto">
              Done managing
            </Link>
          ) : (
            <Link href="/admin?manage=1" className="rounded border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 transition-colors ml-auto">
              Manage events
            </Link>
          )
        )}
      </div>

      {/* ── Event list ──────────────────────────────────────────── */}
      <div className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-gray-500">No events yet. Create one to get started.</p>
        ) : (
          events.map((event) => {
            const statusBadge = event.isActive ? (
              <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                Active
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
                Inactive
              </span>
            )

            const cardContent = (
              <>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-semibold text-gray-900">{event.name}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">{event.slug}</p>
                  </div>
                  {statusBadge}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {event.checkpoints.length} checkpoint{event.checkpoints.length !== 1 ? 's' : ''}
                </p>
              </>
            )

            if (isManaging) {
              return (
                <div key={event.id} className="rounded-lg border bg-white p-4 space-y-4">
                  {cardContent}
                  <div className="flex items-center gap-3 pt-2 border-t">
                    <form action={toggleEventActive}>
                      <input type="hidden" name="eventId" value={event.id} />
                      <input type="hidden" name="current" value={String(event.isActive)} />
                      <button
                        type="submit"
                        className="rounded border px-3 py-1.5 text-xs font-medium hover:bg-gray-50 transition-colors"
                      >
                        {event.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                    </form>
                    <DeleteEventButton eventId={event.id} eventName={event.name} />
                  </div>
                </div>
              )
            }

            return (
              <Link
                key={event.id}
                href={`/admin/events/${event.id}`}
                className="block rounded-lg border bg-white p-4 hover:border-gray-400 hover:shadow-sm transition-all"
              >
                {cardContent}
              </Link>
            )
          })
        )}
      </div>
    </main>
  )
}
