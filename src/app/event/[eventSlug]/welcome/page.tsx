import { db } from '@/lib/db'
import { SESSION_COOKIE_NAME } from '@/lib/session'
import { parseEventStyle } from '@/lib/eventTheme'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import EventThemeStyle from '@/components/EventThemeStyle'

type PageProps = {
  params: Promise<{ eventSlug: string }>
  searchParams: Promise<{ preview?: string }>
}

function recoveryCode(sessionId: string) {
  return sessionId.slice(0, 8).toUpperCase()
}

export default async function WelcomePage({ params, searchParams }: PageProps) {
  const { eventSlug } = await params
  const { preview } = await searchParams
  const isPreview = preview === '1'

  const event = await db.event.findUnique({
    where: { slug: eventSlug, isActive: true },
  })

  if (!event) notFound()

  const cookieStore = await cookies()
  const cookieId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (!cookieId && !isPreview) redirect(`/event/${eventSlug}`)

  const session = cookieId
    ? await db.participantSession.findUnique({
        where: { eventId_cookieId: { eventId: event.id, cookieId } },
      })
    : null

  if (!session && !isPreview) redirect(`/event/${eventSlug}`)

  const theme = parseEventStyle(event.styleJson)

  const code = session ? recoveryCode(session.id) : 'PREVIEW0'
  const ctaText = theme.welcomeCtaText || 'Start the Hunt →'

  const bgStyle = theme.welcomeBackgroundImage
    ? { backgroundImage: `url(${theme.welcomeBackgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {}

  return (
    <div className="event-themed min-h-screen flex items-center justify-center p-6" style={bgStyle}>
      <EventThemeStyle style={theme} />

      <div className="w-full max-w-sm space-y-6">

        {/* Preview banner */}
        {isPreview && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-medium text-amber-700">
            Admin preview — showing demo data
          </div>
        )}

        {/* Header */}
        <div className="text-center">
          {event.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={event.logoUrl} alt={event.name} className="h-12 object-contain mx-auto mb-3" />
          )}
          <h1 className="event-heading">{event.name}</h1>
          {session?.displayName && (
            <p className="event-subtitle mt-1">Welcome, {session.displayName}!</p>
          )}
        </div>

        {/* Recovery code */}
        <div className="event-accent-box rounded-xl border-2 border-dashed p-5 text-center">
          <p className="event-label mb-2 event-accent-text">
            {theme.recoveryCodeTitle}
          </p>
          <p className="event-code font-mono tracking-widest event-accent-text text-3xl font-bold">
            {code}
          </p>
          {theme.recoveryCodeSubtext && (
            <p className="event-label mt-3 event-accent-text opacity-80">
              {theme.recoveryCodeSubtext}
            </p>
          )}
        </div>

        {/* Rules / info text */}
        {theme.welcomeRulesText && (
          <div className="rounded-xl border bg-white p-5">
            <p className="event-body whitespace-pre-wrap">{theme.welcomeRulesText}</p>
          </div>
        )}

        {/* CTA */}
        <Link
          href={isPreview ? '#' : `/event/${eventSlug}/home`}
          className="event-btn-primary block w-full rounded-xl px-6 py-3.5 text-center text-base font-semibold transition-opacity hover:opacity-90"
        >
          {ctaText}
        </Link>

      </div>
    </div>
  )
}
