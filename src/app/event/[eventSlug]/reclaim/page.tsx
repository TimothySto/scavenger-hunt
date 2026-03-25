import { db } from '@/lib/db'
import { notFound, redirect } from 'next/navigation'
import { reclaimSession } from './actions'

type PageProps = {
  params: Promise<{ eventSlug: string }>
  searchParams: Promise<{ sid?: string }>
}

export default async function ReclaimPage({ params, searchParams }: PageProps) {
  const { eventSlug } = await params
  const { sid } = await searchParams

  if (!sid) redirect(`/event/${eventSlug}`)

  const event = await db.event.findUnique({
    where: { slug: eventSlug, isActive: true },
  })
  if (!event) notFound()

  const session = await db.participantSession.findUnique({
    where: { id: sid },
  })

  // Silently redirect to join if session not found or wrong event
  if (!session || session.eventId !== event.id) {
    redirect(`/event/${eventSlug}`)
  }

  const recoveryCode = session.id.slice(0, 8).toUpperCase()
  const action = reclaimSession.bind(null, eventSlug, sid)

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border bg-white shadow-sm p-8 flex flex-col items-center gap-6 text-center">

          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-1">
              {event.name}
            </p>
            <h1 className="text-xl font-bold">Reclaim Your Session</h1>
          </div>

          <div className="w-full rounded-xl bg-amber-50 border border-amber-200 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-amber-700 mb-1">
              Recovery Code
            </p>
            <p className="text-2xl font-mono font-bold tracking-widest text-amber-900">
              {recoveryCode}
            </p>
            {session.displayName && (
              <p className="text-sm text-amber-700 mt-2">
                Playing as <strong>{session.displayName}</strong>
              </p>
            )}
          </div>

          <p className="text-sm text-gray-600 leading-relaxed">
            Tapping the button below will connect <strong>this browser</strong> to your existing
            session, restoring your progress and score.
          </p>

          <form action={action} className="w-full">
            <button
              type="submit"
              className="w-full rounded-lg bg-black px-4 py-3 text-white font-semibold hover:bg-gray-800 transition-colors"
            >
              Reclaim My Session →
            </button>
          </form>

          <p className="text-xs text-gray-400">
            If this doesn&apos;t look right, close this page and ask an organizer for help.
          </p>

        </div>
      </div>
    </main>
  )
}
