'use client'

import { useRef, useState } from 'react'

type ImageItem = { filename: string; url: string }

type Props = {
  label: string
  value: string
  onChange: (url: string) => void
  images: ImageItem[]
  eventId?: string
}

export default function ImagePickerField({ label, value, onChange, images: initialImages, eventId }: Props) {
  const [open, setOpen] = useState(false)
  const [localImages, setLocalImages] = useState<ImageItem[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setUploadError(null)
    try {
      const fd = new FormData()
      fd.append('file', file)
      if (eventId) fd.append('eventId', eventId)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      if (!res.ok) throw new Error('Upload failed')
      const { url } = await res.json() as { url: string }
      const filename = url.split('/').pop() ?? url
      setLocalImages((prev) => [{ filename, url }, ...prev])
      onChange(url)
    } catch {
      setUploadError('Upload failed — try again.')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium mb-1">{label}</label>
      <div className="flex gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://… or /uploads/event-id/image.png"
          className="flex-1 rounded border px-3 py-2 text-sm font-mono text-gray-900 focus:outline-none focus:ring-2 focus:ring-black"
        />
        {value && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-10 w-10 rounded border object-cover bg-gray-100 flex-shrink-0" />
        )}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded border px-3 py-2 text-sm hover:bg-gray-50 transition-colors flex-shrink-0"
        >
          {open ? 'Close' : 'Library'}
        </button>
      </div>

      {open && (
        <div className="mt-2 rounded-lg border bg-gray-50 p-3">
          {/* Library header */}
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-gray-500">
              {localImages.length === 0
                ? 'No images yet'
                : `${localImages.length} image${localImages.length === 1 ? '' : 's'}`}
            </p>
            <div className="flex items-center gap-2">
              {uploadError && <p className="text-xs text-red-500">{uploadError}</p>}
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="rounded border bg-white px-2.5 py-1 text-xs font-medium hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                {uploading ? 'Uploading…' : '+ Upload'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleUpload}
              />
            </div>
          </div>

          {/* Image grid */}
          {localImages.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-3">
              Upload an image to get started.
            </p>
          ) : (
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6">
              {localImages.map((img) => (
                <button
                  key={img.filename}
                  type="button"
                  onClick={() => { onChange(img.url); setOpen(false) }}
                  className={`rounded border-2 overflow-hidden transition-colors ${
                    value === img.url ? 'border-black' : 'border-transparent hover:border-gray-400'
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.url} alt={img.filename} className="h-16 w-full object-cover bg-gray-100" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
