import { db } from '@/lib/db'
import { SESSION_COOKIE_NAME } from '@/lib/session'
import { parseEventStyle } from '@/lib/eventTheme'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import { joinHunt } from './join/actions'
import EventThemeStyle from '@/components/EventThemeStyle'
import { InAppBrowserBanner } from '@/components/InAppBrowserBanner'

type PageProps = {
  params: Promise<{ eventSlug: string }>
  searchParams: Promise<{ next?: string }>
}

export default async function EventLandingPage({ params, searchParams }: PageProps) {
  const { eventSlug } = await params
  const { next } = await searchParams
  const safeNext = next?.startsWith('/') ? next : undefined

  const event = await db.event.findUnique({
    where: { slug: eventSlug, isActive: true },
  })

  if (!event) notFound()

  // If session already exists for this event, send them straight to the homepage
  const cookieStore = await cookies()
  const cookieId = cookieStore.get(SESSION_COOKIE_NAME)?.value

  if (cookieId) {
    const existing = await db.participantSession.findUnique({
      where: { eventId_cookieId: { eventId: event.id, cookieId } },
    })
    if (existing) redirect(safeNext ?? `/event/${eventSlug}/home`)
  }

  const theme = parseEventStyle(event.styleJson)
  const action = joinHunt.bind(null, event.id, eventSlug, safeNext ?? null)

  const bgStyle = theme.landingBackgroundImage
    ? { backgroundImage: `url(${theme.landingBackgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {}

  return (
    <div
      className="event-themed min-h-screen flex items-center justify-center p-6"
      style={bgStyle}
    >
      <InAppBrowserBanner />
      <EventThemeStyle style={theme} />

      <div className="w-full max-w-md">
        <div className="rounded-2xl border bg-white p-8 shadow-sm">

          {event.logoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={event.logoUrl}
              alt={event.name}
              className="h-12 object-contain mb-4"
            />
          )}

          <h1 className="event-heading mb-2">{event.name}</h1>

          {event.description && (
            <p className="event-subtitle mb-8 leading-relaxed">{event.description}</p>
          )}

          <form action={action} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="displayName">
                Nickname <span className="font-normal text-gray-400">(optional)</span>
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                placeholder="e.g. Team Rocket"
                className="w-full rounded-lg border px-4 py-2.5 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
                maxLength={40}
              />
            </div>

            <button
              type="submit"
              className="event-btn-primary w-full rounded-lg px-4 py-3 font-semibold transition-opacity"
            >
              {theme.landingCtaText || 'Join the Hunt →'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
