import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import Link from 'next/link'
import { db } from '@/lib/db'
import { SESSION_COOKIE_NAME } from '@/lib/session'

export const dynamic = 'force-dynamic'

export default async function RootPage() {
  const events = await db.event.findMany({
    where: { isActive: true },
    orderBy: { createdAt: 'desc' },
  })

  // No active events
  if (events.length === 0) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-950">
        <p className="text-gray-500">No active event at this time.</p>
      </main>
    )
  }

  const cookieId = (await cookies()).get(SESSION_COOKIE_NAME)?.value

  // Single active event — fast path
  if (events.length === 1) {
    const event = events[0]
    if (cookieId) {
      const session = await db.participantSession.findUnique({
        where: { eventId_cookieId: { eventId: event.id, cookieId } },
      })
      if (session) redirect(`/event/${event.slug}/home`)
    }
    redirect(`/event/${event.slug}`)
  }

  // Multiple active events — check enrollment across all of them
  let enrolledSlugs: string[] = []
  if (cookieId) {
    const sessions = await db.participantSession.findMany({
      where: {
        cookieId,
        eventId: { in: events.map(e => e.id) },
      },
      select: { eventId: true },
    })
    const enrolledIds = new Set(sessions.map(s => s.eventId))
    enrolledSlugs = events.filter(e => enrolledIds.has(e.id)).map(e => e.slug)

    // Enrolled in exactly one — redirect directly
    if (enrolledSlugs.length === 1) {
      redirect(`/event/${enrolledSlugs[0]}/home`)
    }
  }

  // Show selection screen
  return (
    <main className="min-h-screen bg-gray-950 flex flex-col items-center justify-center p-6 gap-8">
      <h1 className="text-2xl font-bold text-white">Choose your event</h1>
      <div className="flex flex-col gap-4 w-full max-w-md">
        {events.map(event => {
          const isEnrolled = enrolledSlugs.includes(event.slug)
          const href = isEnrolled ? `/event/${event.slug}/home` : `/event/${event.slug}`
          return (
            <Link
              key={event.id}
              href={href}
              className="flex items-center gap-4 bg-gray-900 border border-gray-800 hover:border-cyan-500 rounded-xl p-5 transition-colors group"
            >
              {event.logoUrl && (
                <img
                  src={event.logoUrl}
                  alt={event.name}
                  className="w-14 h-14 object-contain rounded-lg flex-shrink-0"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold group-hover:text-cyan-400 transition-colors">
                  {event.name}
                </p>
                {event.description && (
                  <p className="text-gray-400 text-sm mt-0.5 truncate">{event.description}</p>
                )}
              </div>
              {isEnrolled && (
                <span className="text-xs text-cyan-400 border border-cyan-700 rounded-full px-2 py-0.5 flex-shrink-0">
                  Continue
                </span>
              )}
            </Link>
          )
        })}
      </div>
    </main>
  )
}
