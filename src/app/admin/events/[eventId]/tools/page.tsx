import Link from 'next/link'
import { db } from '@/lib/db'
import { notFound } from 'next/navigation'

type PageProps = {
  params: Promise<{ eventId: string }>
}

const tools = [
  {
    href: (eventId: string) => `/admin/events/${eventId}/tools/recovery`,
    title: 'Hunter Recovery',
    description:
      'Look up a hunter by recovery code, re-link their session to a new device, or adjust their score.',
  },
  {
    href: (eventId: string) => `/admin/events/${eventId}/tools/branding`,
    title: 'Event Branding',
    description:
      'Edit the event name, description, logo, and player page theme — font, colours, and background.',
  },
  {
    href: (eventId: string) => `/admin/events/${eventId}/tools/images`,
    title: 'Image Library',
    description:
      'Upload and manage images for this event. Copy URLs to use in branding and checkpoint content.',
  },
]

export default async function AdminToolsPage({ params }: PageProps) {
  const { eventId } = await params

  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event) notFound()

  return (
    <main className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href={`/admin/events/${eventId}`} className="text-sm text-gray-500 underline">
          ← Back to {event.name}
        </Link>
        <h1 className="text-2xl font-bold mt-2">Admin Tools</h1>
        <p className="text-sm text-gray-500 mt-1">Operational tools for managing an in-progress event.</p>
      </div>

      <div className="space-y-3">
        {tools.map((tool) => (
          <Link
            key={tool.title}
            href={tool.href(eventId)}
            className="block rounded-xl border bg-white p-5 hover:border-black transition-colors group"
          >
            <p className="font-semibold group-hover:underline">{tool.title}</p>
            <p className="text-sm text-gray-500 mt-1">{tool.description}</p>
          </Link>
        ))}
      </div>
    </main>
  )
}
