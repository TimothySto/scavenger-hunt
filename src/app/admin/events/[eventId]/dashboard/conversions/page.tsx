import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'

type PageProps = {
  params: Promise<{ eventId: string }>
}

function relativeTime(date: Date): string {
  const diffMs = Date.now() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return `${diffSec}s ago`
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return date.toLocaleDateString()
}

export default async function ConversionsDashboardPage({ params }: PageProps) {
  const { eventId } = await params

  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event) notFound()

  // All conversions for this event, newest first
  const conversions = await db.checkpointConversion.findMany({
    where: { checkpoint: { eventId } },
    include: {
      checkpoint: { select: { id: true, name: true, slug: true, fallbackUrl: true } },
      session: { select: { id: true, displayName: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Sponsor checkpoints (those with a fallback URL) + their scan counts
  const sponsorCheckpoints = await db.checkpoint.findMany({
    where: { eventId, fallbackUrl: { not: null } },
    include: {
      checkIns: { select: { id: true } },
    },
    orderBy: { createdAt: 'asc' },
  })

  // Build per-checkpoint conversion counts from the flat list
  const convByCheckpoint = new Map<string, { auto: number; manual: number }>()
  for (const c of conversions) {
    const entry = convByCheckpoint.get(c.checkpointId) ?? { auto: 0, manual: 0 }
    if (c.type === 'AUTO') entry.auto++
    else entry.manual++
    convByCheckpoint.set(c.checkpointId, entry)
  }

  const totalScans = sponsorCheckpoints.reduce((sum, cp) => sum + cp.checkIns.length, 0)
  const totalAuto = conversions.filter((c) => c.type === 'AUTO').length
  const totalManual = conversions.filter((c) => c.type === 'MANUAL').length
  const totalConversions = totalAuto + totalManual
  const overallConvRate = totalScans > 0 ? Math.round((totalConversions / totalScans) * 100) : null

  const recentFeed = conversions.slice(0, 50)

  return (
    <main className="p-8 max-w-5xl">
      <div className="mb-6">
        <Link href={`/admin/events/${eventId}`} className="text-sm text-gray-500 underline">
          ← Back to {event.name}
        </Link>
        <h1 className="text-2xl font-bold mt-2">Sponsor Link Conversions</h1>
        {event.conversionBonusPoints > 0 && (
          <p className="text-sm text-gray-500 mt-1">
            Manual bonus: <span className="font-semibold text-amber-600">+{event.conversionBonusPoints} pts</span> per first manual click
          </p>
        )}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Total Scans</p>
          <p className="text-3xl font-bold">{totalScans}</p>
          <p className="text-xs text-gray-400 mt-1">across sponsor checkpoints</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Auto Clicks</p>
          <p className="text-3xl font-bold text-gray-700">{totalAuto}</p>
          <p className="text-xs text-gray-400 mt-1">redirect fired</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Manual Clicks</p>
          <p className="text-3xl font-bold text-green-700">{totalManual}</p>
          <p className="text-xs text-gray-400 mt-1">clicked before redirect</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Overall Conv Rate</p>
          <p className="text-3xl font-bold">
            {overallConvRate !== null ? `${overallConvRate}%` : '—'}
          </p>
          <p className="text-xs text-gray-400 mt-1">scans → any click</p>
        </div>
      </div>

      {/* Per-checkpoint table */}
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
        By Sponsor
      </h2>
      <div className="rounded-xl border bg-white overflow-x-auto mb-8">
        {sponsorCheckpoints.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No sponsor checkpoints with redirect URLs yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3">Checkpoint</th>
                <th className="px-4 py-3 text-right">Scans</th>
                <th className="px-4 py-3 text-right">Auto</th>
                <th className="px-4 py-3 text-right">Manual</th>
                <th className="px-4 py-3 text-right">Manual %</th>
                <th className="px-4 py-3 text-right">Conv %</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sponsorCheckpoints.map((cp) => {
                const counts = convByCheckpoint.get(cp.id) ?? { auto: 0, manual: 0 }
                const scans = cp.checkIns.length
                const total = counts.auto + counts.manual
                const convRate = scans > 0 ? Math.round((total / scans) * 100) : null
                const manualRate = scans > 0 ? Math.round((counts.manual / scans) * 100) : null
                return (
                  <tr key={cp.id}>
                    <td className="px-4 py-3">
                      <span className="font-medium">{cp.name}</span>
                      <span className="ml-2 text-xs text-gray-400 font-mono truncate max-w-xs hidden sm:inline">
                        {cp.fallbackUrl}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{scans}</td>
                    <td className="px-4 py-3 text-right text-gray-500">{counts.auto}</td>
                    <td className="px-4 py-3 text-right">
                      <span className={counts.manual > 0 ? 'font-semibold text-green-700' : 'text-gray-400'}>
                        {counts.manual}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {manualRate !== null ? `${manualRate}%` : '—'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500">
                      {convRate !== null ? `${convRate}%` : '—'}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Recent activity feed */}
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
        Recent Activity {conversions.length > 50 && <span className="normal-case font-normal">(last 50)</span>}
      </h2>
      <div className="rounded-xl border bg-white overflow-hidden">
        {recentFeed.length === 0 ? (
          <p className="p-6 text-sm text-gray-400">No conversions recorded yet.</p>
        ) : (
          <ul className="divide-y text-sm">
            {recentFeed.map((c) => (
              <li key={c.id} className="flex items-center gap-4 px-4 py-2.5">
                <span
                  className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    c.type === 'MANUAL'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {c.type === 'MANUAL' ? 'Manual' : 'Auto'}
                </span>
                <span className="font-medium flex-shrink-0">{c.checkpoint.name}</span>
                <span className="text-gray-400 text-xs flex-shrink-0">
                  {c.session.displayName
                    ? c.session.displayName
                    : <span className="italic">anonymous</span>}
                  {' '}·{' '}
                  <span className="font-mono">{c.session.id.slice(0, 8).toUpperCase()}</span>
                </span>
                <span className="ml-auto text-xs text-gray-400 flex-shrink-0">
                  {relativeTime(c.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
