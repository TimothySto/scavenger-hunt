'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { recordCheckin, recordConversion, type CheckinStatus } from './actions'

const COUNTDOWN_SECONDS = 30

type SponsorContent = {
  sponsorLogo?: string
  backgroundImage?: string
  blurb?: string
}

type Props = {
  eventId: string
  eventName: string
  eventLogoUrl: string | null
  eventSlug: string
  checkpointId: string
  checkpointName: string
  fallbackUrl: string | null
  content: SponsorContent
  conversionBonusPoints: number
  isPreview?: boolean
}

export default function CheckinClient({
  eventId,
  eventName,
  eventLogoUrl,
  eventSlug,
  checkpointId,
  checkpointName,
  fallbackUrl,
  content,
  conversionBonusPoints,
  isPreview = false,
}: Props) {
  const [status, setStatus] = useState<CheckinStatus | null>(null)
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [redirected, setRedirected] = useState(false)

  // Guard against React Strict Mode double-invocation firing the check-in twice,
  // which would cause 'already-checked-in' to show on every genuine first visit.
  const hasCheckedIn = useRef(false)

  // Auto check-in on mount (skipped in preview)
  useEffect(() => {
    if (isPreview || hasCheckedIn.current) return
    hasCheckedIn.current = true
    recordCheckin(eventId, checkpointId).then(setStatus)
  }, [eventId, checkpointId, isPreview])

  // Countdown + redirect — frozen in preview
  useEffect(() => {
    if (!fallbackUrl || isPreview) return
    const interval = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          clearInterval(interval)
          setRedirected(true)
          recordConversion(eventId, checkpointId, 'AUTO').finally(() => {
            window.location.href = fallbackUrl
          })
          return 0
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [fallbackUrl, eventId, checkpointId, isPreview])

  async function goNow() {
    if (isPreview || !fallbackUrl) return
    setRedirected(true)
    await recordConversion(eventId, checkpointId, 'MANUAL')
    window.location.href = fallbackUrl
  }

  const bgStyle = content.backgroundImage
    ? { backgroundImage: `url(${content.backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {}

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={bgStyle}>
      {/* Overlay for readability when background image is set */}
      {content.backgroundImage && (
        <div className="absolute inset-0 bg-black/50" />
      )}

      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-2xl bg-white shadow-xl p-8 flex flex-col items-center gap-5 text-center">

          {/* Event branding */}
          {eventLogoUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={eventLogoUrl} alt={eventName} className="h-10 object-contain" />
          )}
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">
            {eventName}
          </p>

          {/* Sponsor logo */}
          {content.sponsorLogo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={content.sponsorLogo}
              alt={checkpointName}
              className="h-20 object-contain"
            />
          )}

          {/* Checkpoint name if no logo */}
          {!content.sponsorLogo && (
            <h1 className="text-xl font-bold">{checkpointName}</h1>
          )}

          {/* Preview banner */}
          {isPreview && (
            <p className="rounded bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-700 font-medium">
              Admin preview — check-in and redirect disabled
            </p>
          )}

          {/* Points credited indicator */}
          {!isPreview && status === 'ok' && (
            <p className="text-green-600 text-sm font-medium">✓ Points credited!</p>
          )}
          {!isPreview && status === 'already-checked-in' && (
            <p className="text-gray-500 text-sm">Already visited — no double points.</p>
          )}
          {!isPreview && status === 'disabled' && (
            <p className="text-red-500 text-sm font-medium">Your account has been disabled. Please see an event organizer.</p>
          )}
          {!isPreview && status === 'hunt-ended' && (
            <p className="text-gray-500 text-sm">Your hunt is complete — your score is locked in.</p>
          )}
          {!isPreview && status === 'no-session' && (
            <p className="text-amber-600 text-sm font-medium">
              You need to join the hunt first.{' '}
              <Link href={`/event/${eventSlug}`} className="underline">
                Join now →
              </Link>
            </p>
          )}

          {/* Optional blurb */}
          {content.blurb && (
            <p className="text-sm text-gray-600 leading-relaxed">{content.blurb}</p>
          )}

          {/* Redirect section */}
          {fallbackUrl ? (
            <>
              {!redirected ? (
                <>
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-4xl font-mono font-bold text-black">
                      {isPreview ? COUNTDOWN_SECONDS : countdown}
                    </span>
                    <span className="text-xs text-gray-400">seconds until redirect</span>
                  </div>
                  <button
                    onClick={goNow}
                    disabled={isPreview}
                    className="w-full rounded-lg bg-black px-4 py-3 text-white font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Visit {checkpointName} now →
                    {conversionBonusPoints > 0 && (
                      <span className="ml-2 text-xs font-normal opacity-80">
                        +{conversionBonusPoints} bonus pts!
                      </span>
                    )}
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-500">Redirecting…</p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-500 mt-2">No sponsor link for this checkpoint.</p>
          )}

          {/* Return home */}
          <Link
            href={`/event/${eventSlug}/home`}
            className="text-sm text-gray-400 underline hover:text-gray-600"
          >
            Return to hunt
          </Link>
        </div>
      </div>
    </div>
  )
}
