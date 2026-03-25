import { db } from '@/lib/db'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { computeScore } from '@/lib/score'
import { addScoreAdjustment } from './actions'
import ReclaimLinkCopy from './ReclaimLinkCopy'

type PageProps = {
  params: Promise<{ eventId: string }>
  searchParams: Promise<{ code?: string }>
}

export default async function RecoveryToolPage({ params, searchParams }: PageProps) {
  const { eventId } = await params
  const { code } = await searchParams

  const event = await db.event.findUnique({ where: { id: eventId } })
  if (!event) notFound()

  // Search for a session whose ID starts with the entered recovery code
  const normalised = (code ?? '').trim().toLowerCase()
  const session = normalised.length >= 6
    ? await db.participantSession.findFirst({
        where: { eventId, id: { startsWith: normalised } },
        include: {
          checkIns: {
            include: { checkpoint: true },
            orderBy: { checkedInAt: 'desc' },
          },
          adjustments: { orderBy: { createdAt: 'desc' } },
        },
      })
    : null

  const score = session ? computeScore(session.checkIns, session.adjustments) : 0
  const scoringCheckIns = session?.checkIns.filter(
    (ci) => ci.checkpoint.type !== 'PRIZE_REDEMPTION'
  ) ?? []

  const recoveryCode = session ? session.id.slice(0, 8).toUpperCase() : null

  // Build the absolute reclaim URL (works for copy; hunter opens it on their device)
  const baseUrl =
    process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') ?? 'http://localhost:3000'
  const reclaimUrl = session
    ? `${baseUrl}/event/${event.slug}/reclaim?sid=${session.id}`
    : null

  const adjustAction = session
    ? addScoreAdjustment.bind(null, session.id, eventId)
    : null

  return (
    <main className="p-8 max-w-2xl">
      <div className="mb-6">
        <Link href={`/admin/events/${eventId}/tools`} className="text-sm text-gray-500 underline">
          ← Back to Tools
        </Link>
        <h1 className="text-2xl font-bold mt-2">Hunter Recovery</h1>
        <p className="text-sm text-gray-500 mt-1">
          Look up a hunter by their 8-character recovery code to re-link their session or adjust their score.
        </p>
      </div>

      {/* Search form */}
      <form method="GET" className="flex gap-2 mb-8">
        <input
          type="text"
          name="code"
          defaultValue={code ?? ''}
          placeholder="Recovery code (e.g. AB12CD34)"
          maxLength={8}
          className="flex-1 rounded-lg border px-3 py-2 text-sm font-mono uppercase tracking-widest outline-none focus:ring-2 focus:ring-black"
          autoComplete="off"
        />
        <button
          type="submit"
          className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
        >
          Search
        </button>
      </form>

      {/* No match */}
      {normalised.length >= 6 && !session && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          No hunter found with recovery code <strong>{(code ?? '').toUpperCase()}</strong>.
          Double-check the code and try again.
        </div>
      )}

      {/* Result */}
      {session && (
        <div className="space-y-6">

          {/* Identity card */}
          <div className="rounded-xl border bg-white p-5 space-y-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="font-semibold text-lg">
                  {session.displayName ?? <span className="text-gray-400 italic">anonymous</span>}
                </p>
                <p className="font-mono text-xs tracking-widest text-gray-500 mt-0.5">
                  {recoveryCode}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold ${
                  session.completedAt
                    ? 'bg-green-100 text-green-800'
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                {session.completedAt ? 'Complete' : 'Active'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Score</p>
                <p className="text-2xl font-bold">{score}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Checkpoints</p>
                <p className="text-2xl font-bold">{scoringCheckIns.length}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Adjustments</p>
                <p className="text-2xl font-bold">{session.adjustments.length}</p>
              </div>
            </div>

            <p className="text-xs text-gray-400">
              Joined {session.createdAt.toLocaleString()} ·{' '}
              {session.isEnabled ? (
                <span className="text-green-600">Enabled</span>
              ) : (
                <span className="text-red-600">Disabled</span>
              )}
            </p>
          </div>

          {/* Session reclaim */}
          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-semibold mb-1">Re-link Session</h2>
            <p className="text-sm text-gray-500 mb-2">
              Send this link to the hunter. When they open it and confirm, their browser will be
              reconnected to this session.
            </p>
            <ReclaimLinkCopy url={reclaimUrl!} />
          </div>

          {/* Score adjustment */}
          <div className="rounded-xl border bg-white p-5">
            <h2 className="font-semibold mb-1">Adjust Score</h2>
            <p className="text-sm text-gray-500 mb-4">
              Add or subtract points. Use a negative number to deduct. All adjustments are logged.
            </p>

            <form action={adjustAction!} className="space-y-3">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Points (positive or negative)
                  </label>
                  <input
                    type="number"
                    name="points"
                    required
                    placeholder="e.g. 50 or -25"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Reason (optional)
                  </label>
                  <input
                    type="text"
                    name="reason"
                    placeholder="e.g. Missed scan at table 3"
                    className="w-full rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="rounded-lg bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                Apply Adjustment
              </button>
            </form>

            {/* Adjustment history */}
            {session.adjustments.length > 0 && (
              <div className="mt-5 space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                  Adjustment History
                </p>
                {session.adjustments.map((adj) => (
                  <div
                    key={adj.id}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span className="text-gray-600">{adj.reason ?? '(no reason)'}</span>
                    <div className="flex items-center gap-3">
                      <span
                        className={`font-semibold ${adj.points > 0 ? 'text-green-600' : 'text-red-600'}`}
                      >
                        {adj.points > 0 ? '+' : ''}{adj.points}
                      </span>
                      <span className="text-xs text-gray-400">
                        {adj.createdAt.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Checkpoint history */}
          {scoringCheckIns.length > 0 && (
            <div className="rounded-xl border bg-white p-5">
              <h2 className="font-semibold mb-3">Checkpoint History</h2>
              <div className="space-y-2">
                {scoringCheckIns.map((ci) => (
                  <div
                    key={ci.id}
                    className="flex items-center justify-between text-sm"
                  >
                    <span>{ci.checkpoint.name}</span>
                    <div className="flex items-center gap-3 text-gray-500 text-xs">
                      <span className="font-semibold text-gray-700">+{ci.checkpoint.points} pts</span>
                      <span>{ci.checkedInAt.toLocaleString()}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}
    </main>
  )
}
