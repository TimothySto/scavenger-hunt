'use client'

import { useState, useRef } from 'react'

export default function UploadForm({ onUploaded, eventId }: { onUploaded: (url: string) => void; eventId?: string }) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const file = inputRef.current?.files?.[0]
    if (!file) return

    setUploading(true)
    setError(null)

    const formData = new FormData()
    formData.append('file', file)
    if (eventId) formData.append('eventId', eventId)

    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json() as { url?: string; error?: string }

    setUploading(false)

    if (!res.ok || !data.url) {
      setError(data.error ?? 'Upload failed')
      return
    }

    if (inputRef.current) inputRef.current.value = ''
    onUploaded(data.url)
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
        className="text-sm"
        required
      />
      <button
        type="submit"
        disabled={uploading}
        className="rounded bg-black px-4 py-2 text-white text-sm disabled:opacity-50"
      >
        {uploading ? 'Uploading…' : 'Upload'}
      </button>
      {error && <p className="text-sm text-red-600">{error}</p>}
    </form>
  )
}
