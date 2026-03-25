import { db } from '@/lib/db'

export default async function HomePage() {
  const events = await db.event.findMany({
    orderBy: { createdAt: 'desc' },
  })

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Scavenger Hunt Dev Environment</h1>
      <p className="mb-4">Database connection test:</p>

      {events.length === 0 ? (
        <p>No events yet.</p>
      ) : (
        <ul className="list-disc pl-6">
          {events.map((event) => (
            <li key={event.id}>
              {event.name} ({event.slug})
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}