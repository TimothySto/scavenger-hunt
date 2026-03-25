'use client'

import { useState } from 'react'

type Props = {
  url: string
  label?: string
}

// iframe rendered at standard mobile width then scaled down to fit
const FRAME_W = 390
const FRAME_H = 844
const SCALE   = 0.62

const containerW = Math.round(FRAME_W * SCALE)  // 242
const containerH = Math.round(FRAME_H * SCALE)  // 523

export default function PreviewFrame({ url, label = 'Page Preview' }: Props) {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
        <button
          type="button"
          onClick={() => setRefreshKey((k) => k + 1)}
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          Refresh ↺
        </button>
      </div>

      {/* Phone shell */}
      <div
        className="inline-flex flex-col rounded-[2.5rem] border-4 border-gray-700 bg-gray-700 shadow-2xl"
        style={{ width: containerW + 16, gap: 0 }}
      >
        {/* Top bar */}
        <div className="flex items-center justify-center py-2">
          <div className="w-14 h-2.5 rounded-full bg-gray-600" />
        </div>

        {/* Screen */}
        <div
          className="overflow-hidden bg-white"
          style={{ width: containerW, height: containerH }}
        >
          <iframe
            key={refreshKey}
            src={url}
            title={label}
            style={{
              width:  FRAME_W,
              height: FRAME_H,
              border: 'none',
              transform: `scale(${SCALE})`,
              transformOrigin: 'top left',
              display: 'block',
            }}
          />
        </div>

        {/* Bottom bar */}
        <div className="flex items-center justify-center py-3">
          <div className="w-20 h-1 rounded-full bg-gray-500" />
        </div>
      </div>

      <p className="mt-2 text-xs text-gray-400">
        Preview — changes saved above are reflected after refresh.
      </p>
    </div>
  )
}
