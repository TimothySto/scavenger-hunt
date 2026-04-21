'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { submitAnswer, recordConversion, type AnswerStatus } from './actions'

const COUNTDOWN_SECONDS = 30

type Props = {
  eventId: string
  eventName: string
  eventLogoUrl: string | null
  eventSlug: string
  checkpointId: string
  checkpointName: string
  question: string
  correctAnswer: string
  answerChoices: string[]   // empty → free-text input
  acceptedAnswers: string[] // additional correct answers (case-insensitive)
  blurb: string | null
  backgroundImage: string | null
  sponsorLogo: string | null
  fallbackUrl: string | null
  conversionBonusPoints: number
  isPreview?: boolean
}

export default function ExhibitClient({
  eventId,
  eventName,
  eventLogoUrl,
  eventSlug,
  checkpointId,
  checkpointName,
  question,
  correctAnswer,
  answerChoices,
  acceptedAnswers,
  blurb,
  backgroundImage,
  sponsorLogo,
  fallbackUrl,
  conversionBonusPoints,
  isPreview = false,
}: Props) {
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<AnswerStatus | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS)
  const [redirected, setRedirected] = useState(false)

  const isMultiChoice = answerChoices.length > 0
  const solved = status === 'correct' || status === 'already-correct'

  // Countdown + redirect after correct answer, only when a fallbackUrl is set
  useEffect(() => {
    if (!solved || !fallbackUrl || isPreview) return
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
  }, [solved, fallbackUrl, isPreview, eventId, checkpointId])

  async function goNow() {
    if (isPreview || !fallbackUrl) return
    setRedirected(true)
    await recordConversion(eventId, checkpointId, 'MANUAL')
    window.location.href = fallbackUrl
  }

  const bgStyle = backgroundImage
    ? { backgroundImage: `url(${backgroundImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }
    : {}

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (isPreview || !answer.trim() || submitting) return
    setSubmitting(true)
    const result = await submitAnswer(eventId, checkpointId, answer, correctAnswer, acceptedAnswers)
    setStatus(result)
    setSubmitting(false)
    if (result === 'incorrect') setAnswer(isMultiChoice ? '' : answer) // keep text for retry
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={bgStyle}>
      {backgroundImage && <div className="absolute inset-0 bg-black/50" />}

      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-2xl bg-white shadow-xl p-8 flex flex-col gap-5">

          {/* Event branding */}
          <div className="flex flex-col items-center text-center gap-1">
            {eventLogoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={eventLogoUrl} alt={eventName} className="h-10 object-contain mb-1" />
            )}
            <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{eventName}</p>

            {/* Sponsor logo — shown in place of the checkpoint name when present */}
            {sponsorLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sponsorLogo} alt={checkpointName} className="h-16 object-contain mt-1" />
            ) : (
              <h1 className="text-xl font-bold mt-1">{checkpointName}</h1>
            )}
          </div>

          {/* Preview banner */}
          {isPreview && (
            <p className="rounded bg-amber-50 border border-amber-200 px-3 py-1.5 text-xs text-amber-700 font-medium text-center">
              Admin preview — submission disabled
            </p>
          )}

          {/* Blurb */}
          {blurb && (
            <p className="text-sm text-gray-600 leading-relaxed text-center">{blurb}</p>
          )}

          {/* Solved state */}
          {solved ? (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-2xl">✓</span>
              </div>
              <div>
                <p className="font-semibold text-green-700">
                  {status === 'already-correct' ? 'Already answered!' : 'Correct!'}
                </p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {status === 'already-correct'
                    ? 'You already earned points for this exhibit.'
                    : 'Points have been added to your score.'}
                </p>
              </div>

              {/* Redirect splash — shown when a sponsor URL is set */}
              {fallbackUrl ? (
                redirected ? (
                  <p className="text-sm text-gray-500">Redirecting…</p>
                ) : (
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
                )
              ) : (
                <Link
                  href={`/event/${eventSlug}/home`}
                  className="w-full rounded-lg bg-black px-4 py-3 text-white font-semibold text-center hover:bg-gray-800 transition-colors"
                >
                  Return to hunt
                </Link>
              )}

              <Link
                href={`/event/${eventSlug}/home`}
                className="text-sm text-gray-400 underline hover:text-gray-600"
              >
                Return to hunt
              </Link>
            </div>
          ) : (
            /* Question form */
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="rounded-xl bg-gray-50 border p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Question</p>
                <p className="text-sm font-medium text-gray-800 leading-snug">{question}</p>
              </div>

              {/* Status messages */}
              {status === 'incorrect' && (
                <p className="text-sm text-red-600 font-medium text-center">
                  Incorrect — give it another try!
                </p>
              )}
              {status === 'no-session' && (
                <p className="text-sm text-amber-600 font-medium text-center">
                  You need to{' '}
                  <Link href={`/event/${eventSlug}`} className="underline">join the hunt</Link>
                  {' '}first.
                </p>
              )}
              {status === 'hunt-ended' && (
                <p className="text-sm text-gray-500 text-center">
                  Your hunt is complete — score is locked in.
                </p>
              )}
              {status === 'disabled' && (
                <p className="text-sm text-red-500 text-center">
                  Your account has been disabled. Please see an organizer.
                </p>
              )}

              {/* Answer input */}
              {isMultiChoice ? (
                <fieldset className="space-y-2">
                  {answerChoices.map((choice) => (
                    <label
                      key={choice}
                      className={`flex items-center gap-3 rounded-lg border px-4 py-3 cursor-pointer transition-colors ${
                        answer === choice
                          ? 'border-black bg-gray-50'
                          : 'border-gray-200 hover:border-gray-400'
                      }`}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={choice}
                        checked={answer === choice}
                        onChange={() => setAnswer(choice)}
                        className="h-4 w-4 accent-black"
                      />
                      <span className="text-sm">{choice}</span>
                    </label>
                  ))}
                </fieldset>
              ) : (
                <input
                  type="text"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder="Your answer…"
                  className="w-full rounded-lg border px-4 py-3 text-sm text-gray-900 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black"
                  autoComplete="off"
                />
              )}

              <button
                type="submit"
                disabled={isPreview || submitting || !answer.trim()}
                className="w-full rounded-lg bg-black px-4 py-3 text-white font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Checking…' : 'Submit Answer'}
              </button>

              <Link
                href={`/event/${eventSlug}/home`}
                className="text-sm text-gray-400 underline hover:text-gray-600 text-center"
              >
                Return to hunt
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
