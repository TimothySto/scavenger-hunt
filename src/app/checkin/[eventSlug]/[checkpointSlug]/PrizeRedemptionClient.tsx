'use client'

import { useState } from 'react'
import Link from 'next/link'
import { completeHunt } from './actions'

type Props = {
  eventId: string
  eventSlug: string
  eventName: string
  eventLogoUrl: string | null
  checkpointId: string
  checkpointPoints: number
  currentScore: number
  checkpointsCompleted: number
  totalScoringCheckpoints: number
  isAlreadyCompleted: boolean
  prizeInstructions: string | null
}

export default function PrizeRedemptionClient({
  eventId,
  eventSlug,
  eventName,
  eventLogoUrl,
  checkpointId,
  checkpointPoints,
  currentScore,
  checkpointsCompleted,
  totalScoringCheckpoints,
  isAlreadyCompleted,
  prizeInstructions,
}: Props) {
  const [completing, setCompleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleComplete() {
    setCompleting(true)
    setError(null)
    const status = await completeHunt(eventId, checkpointId, checkpointPoints)
    if (status === 'ok' || status === 'already-completed') {
      window.location.href = `/event/${eventSlug}/complete`
    } else {
      // no-session — send them to join first
      window.location.href = `/event/${eventSlug}`
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="rounded-2xl border bg-white shadow-sm p-8 flex flex-col items-center gap-6 text-center">

          {/* Event branding */}
          {eventLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={eventLogoUrl} alt={eventName} className="h-10 object-contain" />
          )}
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 -mt-4">
            {eventName}
          </p>

          {isAlreadyCompleted ? (
            <>
              <div className="text-5xl font-black text-green-600">✓</div>
              <div>
                <p className="text-xl font-bold">Hunt Complete!</p>
                <p className="text-gray-500 text-sm mt-1">You already finished the hunt.</p>
              </div>
              <div className="w-full rounded-xl bg-gray-50 border p-4">
                <p className="text-sm text-gray-500">Your score</p>
                <p className="text-4xl font-black">{currentScore}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {checkpointsCompleted} / {totalScoringCheckpoints} checkpoints
                </p>
              </div>
              <Link
                href={`/event/${eventSlug}/complete`}
                className="w-full rounded-lg bg-black px-4 py-3 text-white font-semibold text-center hover:bg-gray-800 transition-colors"
              >
                View results →
              </Link>
            </>
          ) : (
            <>
              <div>
                <p className="text-lg font-bold">Ready to finish?</p>
                <p className="text-gray-500 text-sm mt-1">Here's where you stand:</p>
              </div>

              <div className="w-full rounded-xl bg-gray-50 border p-4">
                <p className="text-sm text-gray-500">Current score</p>
                <p className="text-4xl font-black">{currentScore} pts</p>
                <p className="text-xs text-gray-400 mt-1">
                  {checkpointsCompleted} / {totalScoringCheckpoints} checkpoints visited
                </p>
              </div>

              {prizeInstructions && (
                <p className="text-sm text-gray-600 leading-relaxed">{prizeInstructions}</p>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <button
                onClick={handleComplete}
                disabled={completing}
                className="w-full rounded-lg bg-black px-4 py-3 text-white font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                {completing ? 'Finishing…' : 'Complete the Hunt'}
              </button>

              <Link
                href={`/event/${eventSlug}/home`}
                className="text-sm text-gray-400 underline hover:text-gray-600"
              >
                Not ready — return to hunt
              </Link>
            </>
          )}
        </div>
      </div>
    </main>
  )
}
