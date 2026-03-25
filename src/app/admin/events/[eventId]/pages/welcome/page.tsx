import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import { readdirSync } from 'fs'
import { join } from 'path'
import Link from 'next/link'
import { parseEventStyle } from '@/lib/eventTheme'
import WelcomePageForm from './WelcomePageForm'
import PreviewFrame from '@/components/admin/PreviewFrame'

type PageProps = { params: Promise<{ eventId: string }> }

function getEventImages(eventId: string) {
  try {
    return readdirSync(join(process.cwd(), 'public', 'uploads', eventId))
      .filter((f) => !f.startsWith('.'))
      .map((filename) => ({ filename, url: `/uploads/${eventId}/${filename}` }))
      .reverse()
  } catch { return [] }
}

export default async function WelcomePageEditorPage({ params }: PageProps) {
  const { eventId } = await params
  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event) notFound()

  const style = parseEventStyle(event.styleJson)
  const images = getEventImages(eventId)

  return (
    <main className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href={`/admin/events/${eventId}`} className="text-sm text-gray-500 underline">
          ← Back to {event.name}
        </Link>
        <h1 className="text-2xl font-bold mt-2">Welcome Page</h1>
        <p className="text-sm text-gray-400 mt-0.5 font-mono">/event/{event.slug}/welcome</p>
      </div>

      <PreviewFrame
        url={`/event/${event.slug}/welcome?preview=1`}
        label="Welcome Page Preview"
      />

      <WelcomePageForm
        eventId={eventId}
        showWelcomePage={style.showWelcomePage}
        welcomeBackgroundImage={style.welcomeBackgroundImage}
        welcomeRulesText={style.welcomeRulesText}
        welcomeCtaText={style.welcomeCtaText}
        images={images}
      />
    </main>
  )
}
