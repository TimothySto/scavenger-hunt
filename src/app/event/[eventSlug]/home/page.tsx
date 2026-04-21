import { db } from '@/lib/db'
import { SESSION_COOKIE_NAME } from '@/lib/session'
import { computeScore } from '@/lib/score'
import { parseEventStyle } from '@/lib/eventTheme'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import EventThemeStyle from '@/components/EventThemeStyle'
import CheckpointList from './CheckpointList'
import { InAppBrowserBanner } from '@/components/InAppBrowserBanner'
import { QrScannerModal } from './QrScannerModal'

type PageProps = {
  params: Promise<{ eventSlug: string }>
  searchParams: Promise<{ preview?: string }>
}

function recoveryCode(sessionId: string) {
  return sessionId.slice(0, 8).toUpperCase()
}

export default async function HuntHomePage({ params, searchParams }: PageProps) {
  const { eventSlug } = await params
  const { preview } = await searchParams
  const isPreview = preview === '1'

  const event = await db.event.findUnique({
    where: { slug: eventSlug, isActive: true },
    include: {
      checkpoints: {
        where: { isActive: true },
        orderBy: { order: 'asc' },
      },
    },
  })

  if (!event) notFound()

  const cookieStore = await cookies()
  const cookieId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!cookieId && !isPreview) redirect(`/event/${eventSlug}`)

  const session = cookieId
    ? await db.participantSession.findUnique({
        where: { eventId_cookieId: { eventId: event.id, cookieId } },
        include: {
          checkIns: { include: { checkpoint: true } },
          adjustments: true,
        },
      })
    : null

  if (!session && !isPreview) redirect(`/event/${eventSlug}`)

  const theme = parseEventStyle(event.styleJson)

  const checkpoints = event.checkpoints
  const completedIds = new Set(session?.checkIns.map((c) => c.checkpointId) ?? [])
  const totalPoints = session ? computeScore(session.checkIns, session.adjustments) : 0
  const conversionBonusPoints = event.conversionBonusPoints ?? 0
  const possiblePoints = checkpoints.reduce((sum, cp) => {
    const bonus = conversionBonusPoints > 0 && cp.fallbackUrl ? conversionBonusPoints : 0
    return sum + cp.points + bonus
  }, 0)

  const bgStyle = theme.homeBackgroundImage
    ? { backgroundImage: `url(${theme.homeBackgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {}

  return (
    <div className="event-themed p-6" style={bgStyle}>
      <InAppBrowserBanner />
      <EventThemeStyle style={theme} />

      <div className="max-w-2xl mx-auto space-y-6">

        {/* Preview banner */}
        {isPreview && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-700">
            Admin preview — showing demo data
          </div>
        )}

        {/* Announcement banner */}
        {theme.homeAnnouncement && (
          <div className="event-accent-box rounded-xl border-2 p-4 text-center">
            <p className="event-body event-accent-text font-medium">{theme.homeAnnouncement}</p>
          </div>
        )}

        {/* Completion banner */}
        {session?.completedAt && (
          <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-center justify-between">
            <div>
              <p className="font-semibold text-green-800">Hunt Complete!</p>
              <p className="text-sm text-green-600">You finished on {session.completedAt.toLocaleDateString()}</p>
            </div>
            <Link href={`/event/${eventSlug}/complete`} className="text-sm font-medium text-green-700 underline">
              View results →
            </Link>
          </div>
        )}

        {/* Header */}
        <div className="flex items-center gap-4">
          {event.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.logoUrl} alt={event.name} className="h-10 object-contain" />
          )}
          <div>
            <h1 className="event-heading">{event.name}</h1>
            {session?.displayName && (
              <p className="event-subtitle mt-0.5">Playing as {session.displayName}</p>
            )}
          </div>
        </div>

        {/* Recovery code */}
        {theme.showRecoveryCode && (
          <div className="event-accent-box rounded-xl border-2 border-dashed p-5">
            <p className="event-label mb-1 event-accent-text">
              {theme.recoveryCodeTitle}
            </p>
            <p className="event-code font-mono tracking-widest event-accent-text">
              {session ? recoveryCode(session.id) : 'PREVIEW0'}
            </p>
            {theme.recoveryCodeSubtext && (
              <p className="event-label mt-2 event-accent-text opacity-80">
                {theme.recoveryCodeSubtext}
              </p>
            )}
          </div>
        )}

        {/* Score summary */}
        <div className="rounded-xl border bg-white p-5 flex items-center justify-between">
          <div>
            <p className="event-label">Checkpoints</p>
            <p className="event-score">
              {completedIds.size}
              <span className="text-gray-400 font-normal text-base"> / {checkpoints.length}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="event-label">Score</p>
            <p className="event-score">
              {totalPoints}
              <span className="text-gray-400 font-normal text-base"> / {possiblePoints} pts</span>
            </p>
          </div>
        </div>

        {/* QR scanner */}
        {!isPreview && (
          <QrScannerModal eventSlug={eventSlug} primaryColor={theme.primaryColor} />
        )}

        {/* Checkpoint list */}
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
            Checkpoints
          </h2>
          <CheckpointList
            checkpoints={checkpoints.map((cp) => ({
              id: cp.id,
              name: cp.name,
              slug: cp.slug,
              type: cp.type,
              points: cp.points,
              clue: cp.clue,
              fallbackUrl: cp.fallbackUrl ?? null,
              contentJson: cp.contentJson as Record<string, unknown> | null,
            }))}
            completedIds={[...completedIds]}
            eventSlug={eventSlug}
            primaryColor={theme.primaryColor}
            conversionBonusPoints={conversionBonusPoints}
          />
        </div>

      </div>
    </div>
  )
}
