'use client'

import { useState, useEffect, useRef } from 'react'
import QRCode from 'qrcode'

type Props = {
  url: string
}

export default function ReclaimLinkCopy({ url }: Props) {
  const [copied, setCopied] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (showQr && canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, url, { width: 240, margin: 2 })
    }
  }, [showQr, url])

  async function handleCopy() {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 flex-wrap">
        <code className="flex-1 min-w-0 truncate rounded bg-gray-100 px-3 py-2 text-xs font-mono text-gray-700 border">
          {url}
        </code>
        <button
          onClick={handleCopy}
          className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white hover:bg-gray-800 transition-colors shrink-0"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
        <button
          onClick={() => setShowQr((v) => !v)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors shrink-0"
        >
          {showQr ? 'Hide QR' : 'Show QR'}
        </button>
      </div>

      {showQr && (
        <div className="flex flex-col items-center gap-2 rounded-xl border bg-gray-50 p-5">
          <canvas ref={canvasRef} className="rounded" />
          <p className="text-xs text-gray-400">Hunter scans to re-link their session</p>
        </div>
      )}
    </div>
  )
}
