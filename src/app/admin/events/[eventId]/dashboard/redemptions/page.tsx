import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { computeScore } from '@/lib/score'

type PageProps = {
  params: Promise<{ eventId: string }>
}

export default async function RedemptionReportPage({ params }: PageProps) {
  const { eventId } = await params

  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event) notFound()

  const totalHunters = await db.participantSession.count({ where: { eventId } })

  const sessions = await db.participantSession.findMany({
    where: { eventId, completedAt: { not: null } },
    include: {
      checkIns: {
        include: { checkpoint: true },
        orderBy: { checkedInAt: 'desc' },
      },
      adjustments: true,
    },
    orderBy: { completedAt: 'asc' },
  })

  const redeemers = sessions.map((s, i) => {
    const scoringCheckIns = s.checkIns.filter((ci) => ci.checkpoint.type !== 'PRIZE_REDEMPTION')
    return {
      rank: i + 1,
      id: s.id,
      recoveryCode: s.id.slice(0, 8).toUpperCase(),
      displayName: s.displayName,
      score: computeScore(s.checkIns, s.adjustments),
      collections: scoringCheckIns.length,
      completedAt: s.completedAt!,
      isEnabled: s.isEnabled,
    }
  })

  // Re-sort by score desc for the leaderboard view, keep arrival rank separate
  const byScore = [...redeemers].sort((a, b) => b.score - a.score)

  return (
    <main className="p-8 max-w-5xl">
      <div className="mb-6">
        <Link href={`/admin/events/${eventId}`} className="text-sm text-gray-500 underline">
          ← Back to {event.name}
        </Link>
        <h1 className="text-2xl font-bold mt-2">Prize Redemptions</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Redeemed</p>
          <p className="text-3xl font-bold text-green-600">{redeemers.length}</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Total Hunters</p>
          <p className="text-3xl font-bold">{totalHunters}</p>
        </div>
        <div className="rounded-xl border bg-white p-5">
          <p className="text-sm text-gray-500">Redemption Rate</p>
          <p className="text-3xl font-bold">
            {totalHunters > 0 ? Math.round((redeemers.length / totalHunters) * 100) : 0}%
          </p>
        </div>
      </div>

      {redeemers.length === 0 ? (
        <div className="rounded-xl border bg-white p-10 text-center text-gray-400">
          No hunters have redeemed their prize yet.
        </div>
      ) : (
        <div className="rounded-xl border bg-white overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3 text-right">#</th>
                <th className="px-4 py-3">Hunter</th>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3 text-right">Score</th>
                <th className="px-4 py-3 text-right">Checkpoints</th>
                <th className="px-4 py-3">Finished At</th>
                <th className="px-4 py-3">Arrival Order</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {byScore.map((h, scoreRank) => (
                <tr key={h.id} className={h.isEnabled ? '' : 'opacity-40'}>
                  <td className="px-4 py-3 text-right font-bold text-gray-400">{scoreRank + 1}</td>
                  <td className="px-4 py-3 font-medium">
                    {h.displayName ?? <span className="text-gray-400 italic">anonymous</span>}
                    {!h.isEnabled && (
                      <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs text-gray-400">disabled</span>
                    )}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{h.recoveryCode}</td>
                  <td className="px-4 py-3 text-right font-semibold">{h.score}</td>
                  <td className="px-4 py-3 text-right text-gray-500">{h.collections}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {h.completedAt.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-xs">#{h.rank}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
