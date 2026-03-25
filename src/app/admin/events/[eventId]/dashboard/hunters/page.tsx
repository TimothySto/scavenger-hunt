import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { computeScore } from '@/lib/score'
import HunterTable from './HunterTable'

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

export default async function HunterDashboardPage({ params }: PageProps) {
  const { eventId } = await params

  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event) notFound()

  const sessions = await db.participantSession.findMany({
    where: { eventId },
    include: {
      checkIns: {
        include: { checkpoint: true },
        orderBy: { checkedInAt: 'desc' },
      },
      adjustments: true,
      conversions: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  const hunters = sessions.map((s) => {
    const scoringCheckIns = s.checkIns.filter((ci) => ci.checkpoint.type !== 'PRIZE_REDEMPTION')
    const score = computeScore(s.checkIns, s.adjustments)
    const lastCheckIn = s.checkIns[0]?.checkedInAt ?? null
    const lastConversionAt = s.conversions[0]?.createdAt ?? null
    return {
      id: s.id,
      displayName: s.displayName,
      recoveryCode: s.id.slice(0, 8).toUpperCase(),
      status: (s.completedAt ? 'complete' : 'active') as 'complete' | 'active',
      collections: scoringCheckIns.length,
      score,
      lastScan: lastCheckIn ? relativeTime(lastCheckIn) : null,
      lastConversion: lastConversionAt ? relativeTime(lastConversionAt) : null,
      isEnabled: s.isEnabled,
    }
  })

  const totalHunters = hunters.length
  const activeHunters = hunters.filter((h) => h.status === 'active').length
  const completedHunters = hunters.filter((h) => h.status === 'complete').length

  return (
    <main className="p-8 max-w-5xl">
      <div className="mb-6">
        <Link href={`/admin/events/${eventId}`} className="text-sm text-gray-500 underline">
          ← Back to {event.name}
        </Link>
        <h1 className="text-2xl font-bold mt-2">Hunter Dashboard</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Total Hunters</p>
          <p className="text-3xl font-bold">{totalHunters}</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-3xl font-bold text-blue-600">{activeHunters}</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Completed</p>
          <p className="text-3xl font-bold text-green-600">{completedHunters}</p>
        </div>
      </div>

      <HunterTable hunters={hunters} />
    </main>
  )
}
