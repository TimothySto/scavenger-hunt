'use client'

import { useState, useTransition } from 'react'
import { setHunterEnabled, deleteSession } from '../actions'

type Hunter = {
  id: string
  displayName: string | null
  recoveryCode: string
  status: 'complete' | 'active'
  collections: number
  score: number
  lastScan: string | null
  lastConversion: string | null
  isEnabled: boolean
}

type Props = {
  hunters: Hunter[]
}

export default function HunterTable({ hunters }: Props) {
  const [query, setQuery] = useState('')
  const [dangerOpen, setDangerOpen] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)
  const [deleting, startDeleting] = useTransition()

  const filtered = query.trim()
    ? hunters.filter((h) => {
        const q = query.toLowerCase()
        return (
          (h.displayName ?? '').toLowerCase().includes(q) ||
          h.recoveryCode.toLowerCase().includes(q)
        )
      })
    : hunters

  return (
    <div>
      <div className="mb-4">
        <input
          type="search"
          placeholder="Search by nickname or recovery code…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full max-w-sm rounded-lg border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div className="rounded-xl border bg-white overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">
              <th className="px-4 py-3">Nickname</th>
              <th className="px-4 py-3">Recovery Code</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Collections</th>
              <th className="px-4 py-3 text-right">Score</th>
              <th className="px-4 py-3">Last Scan</th>
              <th className="px-4 py-3">Last Conv.</th>
              <th className="px-4 py-3">Enabled</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-6 text-center text-gray-400">
                  No hunters found.
                </td>
              </tr>
            )}
            {filtered.map((h) => {
              const toggleAction = setHunterEnabled.bind(null, h.id, !h.isEnabled)
              return (
                <tr key={h.id} className={h.isEnabled ? '' : 'opacity-50 bg-gray-50'}>
                  <td className="px-4 py-3 font-medium">
                    {h.displayName ?? <span className="text-gray-400 italic">anonymous</span>}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs tracking-widest">{h.recoveryCode}</td>
                  <td className="px-4 py-3">
                    {h.status === 'complete' ? (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800">
                        Complete
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-800">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">{h.collections}</td>
                  <td className="px-4 py-3 text-right font-semibold">{h.score}</td>
                  <td className="px-4 py-3 text-gray-500">{h.lastScan ?? '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{h.lastConversion ?? '—'}</td>
                  <td className="px-4 py-3">
                    <form action={toggleAction}>
                      <button
                        type="submit"
                        className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                          h.isEnabled
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {h.isEnabled ? 'On' : 'Off'}
                      </button>
                    </form>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {/* Danger Zone */}
      <div className="mt-6 rounded-xl border border-red-200 bg-red-50">
        <button
          type="button"
          onClick={() => { setDangerOpen((v) => !v); setPendingDelete(null) }}
          className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-red-700"
        >
          <span>⚠ Danger Zone — Testing Tools</span>
          <span className="text-xs font-normal text-red-400">{dangerOpen ? 'Hide ▲' : 'Show ▼'}</span>
        </button>

        {dangerOpen && (
          <div className="border-t border-red-200 px-4 pb-4 pt-3">
            <p className="text-xs text-red-600 mb-3">
              Permanently deletes the session and all associated check-ins, adjustments, and conversions.
              This cannot be undone. For testing use only.
            </p>
            <ul className="space-y-2">
              {hunters.length === 0 && (
                <li className="text-sm text-gray-400">No sessions to delete.</li>
              )}
              {hunters.map((h) => (
                <li key={h.id} className="flex items-center gap-3">
                  <span className="font-mono text-xs text-gray-500 w-20 flex-shrink-0">
                    {h.recoveryCode}
                  </span>
                  <span className="text-sm flex-1 truncate">
                    {h.displayName ?? <span className="italic text-gray-400">anonymous</span>}
                  </span>
                  <span className="text-xs text-gray-400 flex-shrink-0">
                    {h.score} pts · {h.collections} stops
                  </span>

                  {pendingDelete === h.id ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        type="button"
                        disabled={deleting}
                        onClick={() => {
                          startDeleting(async () => {
                            await deleteSession(h.id)
                            setPendingDelete(null)
                          })
                        }}
                        className="rounded bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                      >
                        {deleting ? 'Deleting…' : 'Confirm Delete'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(null)}
                        className="rounded border px-3 py-1 text-xs text-gray-500 hover:bg-white"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPendingDelete(h.id)}
                      className="flex-shrink-0 rounded border border-red-300 px-3 py-1 text-xs text-red-600 hover:bg-red-100"
                    >
                      Delete
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}
