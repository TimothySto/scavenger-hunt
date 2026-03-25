import { db } from '@/lib/db'
import { SESSION_COOKIE_NAME } from '@/lib/session'
import { computeScore } from '@/lib/score'
import { parseEventStyle } from '@/lib/eventTheme'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import EventThemeStyle from '@/components/EventThemeStyle'

type PageProps = {
  params: Promise<{ eventSlug: string }>
}

function recoveryCode(sessionId: string) {
  return sessionId.slice(0, 8).toUpperCase()
}

export default async function CompletePage({ params }: PageProps) {
  const { eventSlug } = await params

  const event = await db.event.findUnique({
    where: { slug: eventSlug, isActive: true },
  })

  if (!event) notFound()

  const cookieStore = await cookies()
  const cookieId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!cookieId) redirect(`/event/${eventSlug}/home`)

  const session = await db.participantSession.findUnique({
    where: { eventId_cookieId: { eventId: event.id, cookieId } },
    include: {
      checkIns: {
        include: { checkpoint: true },
      },
      adjustments: true,
    },
  })

  if (!session || !session.completedAt) redirect(`/event/${eventSlug}/home`)

  const theme = parseEventStyle(event.styleJson)

  const scoringCheckIns = session.checkIns.filter(
    (ci) => ci.checkpoint.type !== 'PRIZE_REDEMPTION'
  )
  const finalScore = computeScore(session.checkIns, session.adjustments)
  const totalCheckpoints = await db.checkpoint.count({
    where: { eventId: event.id, isActive: true },
  })
  const scoringTotal = totalCheckpoints - 1 // exclude prize redemption checkpoint

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-900 to-gray-800 flex items-center justify-center p-6"
      style={{ fontFamily: `'${theme.fontFamily}', ui-sans-serif, system-ui, sans-serif` }}
    >
      <EventThemeStyle style={theme} />

      <div className="w-full max-w-sm space-y-5">

        {/* Completion banner */}
        <div className="rounded-2xl bg-white p-8 text-center shadow-xl">
          {event.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.logoUrl} alt={event.name} className="h-10 object-contain mx-auto mb-4" />
          )}
          <p className="text-4xl mb-3">🎉</p>
          <h1 className="event-heading mb-1">Hunt Complete!</h1>
          {session.displayName && (
            <p className="event-subtitle">Well done, {session.displayName}!</p>
          )}
        </div>

        {/* Final score */}
        <div className="rounded-2xl bg-white p-6 text-center shadow-xl">
          <p className="event-label mb-2">Final Score</p>
          <p className="event-score" style={{ color: theme.primaryColor }}>
            {finalScore}
          </p>
          <p className="event-subtitle mt-2">
            {scoringCheckIns.length} / {scoringTotal} checkpoints visited
          </p>
        </div>

        {/* Prize redemption instructions */}
        <div
          className="rounded-2xl border p-6 shadow-xl"
          style={{
            backgroundColor: `${theme.accentColor}18`,
            borderColor: theme.accentColor,
          }}
        >
          <p className="text-sm font-semibold mb-2" style={{ color: theme.accentColor }}>
            Redeem Your Prize
          </p>
          <p className="text-sm leading-relaxed" style={{ color: theme.accentColor }}>
            Show this screen to an organizer to claim your prize.
          </p>
        </div>

        {/* Recovery code for organizer verification */}
        <div className="rounded-2xl bg-white p-5 text-center shadow-xl">
          <p className="event-label mb-2">Verification Code</p>
          <p className="event-code font-mono tracking-widest">
            {recoveryCode(session.id)}
          </p>
        </div>

      </div>
    </main>
  )
}
