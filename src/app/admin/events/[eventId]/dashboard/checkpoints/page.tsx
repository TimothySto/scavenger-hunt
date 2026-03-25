import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { setCheckpointActive } from '../actions'

type PageProps = {
  params: Promise<{ eventId: string }>
}

const typeLabel: Record<string, string> = {
  ONSITE_SPONSOR:   'Sponsor',
  OFFSITE_SPONSOR:  'Sponsor (off)',
  EXHIBIT:          'Exhibit',
  EXHIBIT_QUESTION: 'Interactive',
  ONLINE_ONLY:      'Online',
  PRIZE_REDEMPTION: 'Prize',
  EVENT_GENERAL:    'Event',
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

export default async function CheckpointDashboardPage({ params }: PageProps) {
  const { eventId } = await params

  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event) notFound()

  const checkpoints = await db.checkpoint.findMany({
    where: { eventId },
    include: {
      checkIns: { orderBy: { checkedInAt: 'desc' } },
      conversions: { orderBy: { createdAt: 'desc' } },
    },
    orderBy: { createdAt: 'asc' },
  })

  const totalCollections = checkpoints.reduce((sum, cp) => sum + cp.checkIns.length, 0)
  const totalConversions = checkpoints.reduce((sum, cp) => sum + cp.conversions.length, 0)
  const totalManual = checkpoints.reduce(
    (sum, cp) => sum + cp.conversions.filter((c) => c.type === 'MANUAL').length, 0
  )
  const activeCount = checkpoints.filter((cp) => cp.isActive).length

  return (
    <main className="p-8 max-w-6xl">
      <div className="mb-6">
        <Link href={`/admin/events/${eventId}`} className="text-sm text-gray-500 underline">
          ← Back to {event.name}
        </Link>
        <h1 className="text-2xl font-bold mt-2">Checkpoint Dashboard</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-8 sm:grid-cols-4">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Total Collections</p>
          <p className="text-3xl font-bold">{totalCollections}</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Total Conversions</p>
          <p className="text-3xl font-bold">{totalConversions}</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Manual Clicks</p>
          <p className="text-3xl font-bold">{totalManual}</p>
          {event.conversionBonusPoints > 0 && (
            <p className="text-xs text-amber-600 mt-1">+{event.conversionBonusPoints} pts each</p>
          )}
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Active Checkpoints</p>
          <p className="text-3xl font-bold">
            {activeCount}
            <span className="text-gray-400 font-normal text-lg"> / {checkpoints.length}</span>
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Pts</th>
              <th className="px-4 py-3 text-right">Scans</th>
              <th className="px-4 py-3 text-right">Auto</th>
              <th className="px-4 py-3 text-right">Manual</th>
              <th className="px-4 py-3 text-right">Conv %</th>
              <th className="px-4 py-3">Last Scan</th>
              <th className="px-4 py-3">Last Conv.</th>
              <th className="px-4 py-3">Link</th>
              <th className="px-4 py-3">Active</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {checkpoints.map((cp) => {
              const lastScan = cp.checkIns[0]?.checkedInAt ?? null
              const lastConversion = cp.conversions[0]?.createdAt ?? null
              const autoCount = cp.conversions.filter((c) => c.type === 'AUTO').length
              const manualCount = cp.conversions.filter((c) => c.type === 'MANUAL').length
              const convRate = cp.checkIns.length > 0
                ? Math.round((cp.conversions.length / cp.checkIns.length) * 100)
                : null
              const toggleAction = setCheckpointActive.bind(null, cp.id, !cp.isActive)

              return (
                <tr key={cp.id} className={cp.isActive ? '' : 'opacity-50'}>
                  <td className="px-4 py-3 font-medium">{cp.name}</td>
                  <td className="px-4 py-3 text-gray-500">{typeLabel[cp.type] ?? cp.type}</td>
                  <td className="px-4 py-3 text-right">{cp.points}</td>
                  <td className="px-4 py-3 text-right font-semibold">{cp.checkIns.length}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{cp.fallbackUrl ? autoCount : '—'}</td>
                  <td className="px-4 py-3 text-right">
                    {cp.fallbackUrl ? (
                      <span className={manualCount > 0 ? 'font-semibold text-green-700' : 'text-gray-500'}>
                        {manualCount}
                      </span>
                    ) : '—'}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {convRate !== null ? `${convRate}%` : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {lastScan ? relativeTime(lastScan) : '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {lastConversion ? relativeTime(lastConversion) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/checkin/${event.slug}/${cp.slug}`}
                      className="text-blue-600 underline text-xs"
                      target="_blank"
                    >
                      Open →
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <form action={toggleAction}>
                      <button
                        type="submit"
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                          cp.isActive
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {cp.isActive ? 'On' : 'Off'}
                      </button>
                    </form>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </main>
  )
}
