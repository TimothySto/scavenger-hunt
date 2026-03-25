import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { parseEventStyle } from '@/lib/eventTheme'
import BrandingForm from './BrandingForm'

type PageProps = {
  params: Promise<{ eventId: string }>
}

export default async function BrandingPage({ params }: PageProps) {
  const { eventId } = await params

  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event) notFound()

  const style = parseEventStyle(event.styleJson)

  return (
    <main className="p-8 max-w-5xl">
      <div className="mb-6">
        <Link href={`/admin/events/${eventId}/tools`} className="text-sm text-gray-500 underline">
          ← Back to Tools
        </Link>
        <h1 className="text-2xl font-bold mt-2">Event Branding</h1>
        <p className="text-sm text-gray-500 mt-1">
          Customise how the hunt looks for players. Changes apply to the join page, hunt homepage,
          and completion page.
        </p>
      </div>

      <BrandingForm
        eventId={eventId}
        initial={{
          name: event.name,
          description: event.description ?? '',
          logoUrl: event.logoUrl ?? '',
          style,
        }}
      />
    </main>
  )
}
