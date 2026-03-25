'use client'

import { useState } from 'react'
import Link from 'next/link'

// ─── types ────────────────────────────────────────────────────────────────────

export type CheckpointRow = {
  id: string
  name: string
  slug: string
  type: string
  points: number
  clue: string | null
  contentJson: Record<string, unknown> | null
}

type Props = {
  checkpoints: CheckpointRow[]
  completedIds: string[]
  eventSlug: string
  primaryColor: string
}

// ─── shared label map ─────────────────────────────────────────────────────────

const typeLabel: Record<string, string> = {
  ONSITE_SPONSOR:   'Sponsor',
  OFFSITE_SPONSOR:  'Sponsor',
  EXHIBIT:          'Exhibit',
  EXHIBIT_QUESTION: 'Interactive',
  ONLINE_ONLY:      'Online',
  PRIZE_REDEMPTION: 'Prize',
  EVENT_GENERAL:    'Event',
}

// ─── SVG icons ────────────────────────────────────────────────────────────────

function ChevronDown({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  )
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  )
}

// ─── component ────────────────────────────────────────────────────────────────

export default function CheckpointList({ checkpoints, completedIds: completedArr, eventSlug, primaryColor }: Props) {
  const completedIds = new Set(completedArr)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  function toggle(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="space-y-2">
      {checkpoints.map((cp) => {
        const done        = completedIds.has(cp.id)
        const isOnline    = cp.type === 'ONLINE_ONLY'
        const isOffsite   = cp.type === 'OFFSITE_SPONSOR'
        const isExpanded  = expandedIds.has(cp.id)

        // EXHIBIT_QUESTION is always linkable; EXHIBIT is linkable only with questionMode flag
        const isExhibitQuestion = cp.type === 'EXHIBIT_QUESTION'
        const exhibitContent = cp.type === 'EXHIBIT' && cp.contentJson ? cp.contentJson : null
        const isExhibitQuestionMode = isExhibitQuestion || !!(
          exhibitContent?.questionMode === true &&
          typeof exhibitContent?.question === 'string' &&
          (exhibitContent.question as string).length > 0
        )

        const directHref  = (isOnline || isExhibitQuestionMode) ? `/checkin/${eventSlug}/${cp.slug}` : null
        const isLinkable  = !!directHref && !done
        const showCyan    = isLinkable && isExpanded

        const sponsorLogo  = cp.contentJson?.sponsorLogo as string | undefined
        const hideTag      = cp.contentJson?.showTag === false
        const linkLabel    = isOnline ? 'Visit online' : 'Answer the question'

        return (
          <div
            key={cp.id}
            className={[
              'rounded-xl border bg-white overflow-hidden transition-colors duration-150',
              done     ? 'opacity-60'       : '',
              showCyan ? 'border-cyan-400'  : 'border-gray-200',
            ].join(' ')}
          >
            {/* ── header row ── click anywhere in here to toggle */}
            <button
              type="button"
              onClick={() => toggle(cp.id)}
              className="w-full text-left px-4 pt-4 pb-3 flex items-center gap-3"
            >
              {/* Completion ring */}
              <div
                className="h-5 w-5 flex-shrink-0 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                style={
                  done
                    ? { borderColor: primaryColor, backgroundColor: primaryColor, color: '#fff' }
                    : { borderColor: '#d1d5db', color: 'transparent' }
                }
              >
                ✓
              </div>

              {/* Optional sponsor logo */}
              {sponsorLogo && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={sponsorLogo} alt="" className="h-7 w-7 object-contain flex-shrink-0 rounded" />
              )}

              {/* Name + type badge */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="event-body font-semibold">{cp.name}</span>
                  {!hideTag && (
                    <span className="text-xs text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
                      {typeLabel[cp.type] ?? cp.type}
                    </span>
                  )}
                </div>
              </div>

              {/* Points + right chevron when linkable-and-expanded */}
              <div className="flex-shrink-0 flex items-center gap-1.5">
                <span className="text-sm font-semibold text-gray-700">{cp.points} pts</span>
                {showCyan && (
                  <ChevronRight className="w-4 h-4 text-cyan-500" />
                )}
              </div>
            </button>

            {/* ── expanded body ── */}
            {isExpanded && (
              <div className="px-4 pb-3 border-t border-gray-100 pt-3 space-y-2">
                {cp.clue ? (
                  <p className="text-sm text-gray-500">{cp.clue}</p>
                ) : (
                  <p className="text-sm text-gray-400 italic">No hint available.</p>
                )}

                {isOffsite && !done && (
                  <p className="text-xs text-gray-400">
                    Find their QR code in their onsite materials
                  </p>
                )}

                {isLinkable && (
                  <Link
                    href={directHref}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-1 flex items-center justify-between rounded-lg border border-cyan-400 bg-cyan-50 px-4 py-2.5 text-sm font-medium text-cyan-700 hover:bg-cyan-100 transition-colors"
                  >
                    {linkLabel}
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}
              </div>
            )}

            {/* ── bottom chevron strip ── secondary tap target / visual indicator */}
            <button
              type="button"
              onClick={() => toggle(cp.id)}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              className="w-full flex justify-center py-1.5 text-gray-300 hover:text-gray-400 transition-colors"
            >
              <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
          </div>
        )
      })}
    </div>
  )
}
