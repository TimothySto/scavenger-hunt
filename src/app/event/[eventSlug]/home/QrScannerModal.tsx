'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import jsQR from 'jsqr'

type Props = {
  eventSlug: string
  primaryColor: string
}

export function QrScannerModal({ eventSlug, primaryColor }: Props) {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const router = useRouter()

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop())
      streamRef.current = null
    }
  }, [])

  const close = useCallback(() => {
    stopCamera()
    setOpen(false)
    setError(null)
  }, [stopCamera])

  const scan = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scan)
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const code = jsQR(imageData.data, imageData.width, imageData.height)

    if (code) {
      try {
        // Accept absolute URLs or relative paths
        let path: string
        try {
          const url = new URL(code.data)
          path = url.pathname
        } catch {
          // Treat as a relative path if not a valid absolute URL
          path = code.data.startsWith('/') ? code.data : `/${code.data}`
        }

        const checkpointPattern = /^\/checkin\/([^/]+)\/([^/]+)\/?$/
        if (checkpointPattern.test(path)) {
          stopCamera()
          setOpen(false)
          router.push(path)
          return
        } else {
          setError('QR code not recognized as a checkpoint.')
        }
      } catch {
        setError('Could not read QR code.')
      }
    }

    rafRef.current = requestAnimationFrame(scan)
  }, [router, stopCamera])

  useEffect(() => {
    if (!open) return

    async function startCamera() {
      setError(null)
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        })
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play()
          rafRef.current = requestAnimationFrame(scan)
        }
      } catch {
        setError('Camera access denied. Please allow camera access and try again.')
      }
    }

    startCamera()

    return () => {
      stopCamera()
    }
  }, [open, scan, stopCamera])

  return (
    <>
      {/* Floating scan button */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Scan QR code"
        style={{ backgroundColor: primaryColor }}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full shadow-lg text-white text-2xl hover:opacity-90 active:scale-95 transition-transform"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-7 w-7">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 9V5a2 2 0 012-2h4M3 15v4a2 2 0 002 2h4m10-14h-4M21 15v4a2 2 0 01-2 2h-4M9 9h6v6H9z" />
        </svg>
      </button>

      {/* Fullscreen modal */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-black/70">
            <p className="text-white text-sm font-medium">Point camera at a checkpoint QR code</p>
            <button
              onClick={close}
              className="text-white text-2xl leading-none px-2"
              aria-label="Close scanner"
            >
              ✕
            </button>
          </div>

          {/* Video feed */}
          <div className="relative flex-1 overflow-hidden">
            <video
              ref={videoRef}
              muted
              playsInline
              className="absolute inset-0 w-full h-full object-cover"
            />
            {/* Scan frame overlay */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-56 h-56 border-2 border-white rounded-xl opacity-60" />
            </div>
          </div>

          {/* Hidden canvas for image processing */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Error message */}
          {error && (
            <div className="px-4 py-3 bg-red-900/80 text-red-100 text-sm text-center">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-3 underline text-red-200"
              >
                Dismiss
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
