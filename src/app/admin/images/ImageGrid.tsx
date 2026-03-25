'use client'

import { useState } from 'react'
import UploadForm from './UploadForm'

type ImageItem = { filename: string; url: string }

export default function ImageGrid({ initial, eventId }: { initial: ImageItem[]; eventId?: string }) {
  const [images, setImages] = useState(initial)
  const [copied, setCopied] = useState<string | null>(null)

  function handleUploaded(url: string) {
    const filename = url.split('/').pop() ?? url
    setImages((prev) => [{ filename, url }, ...prev])
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url)
    setCopied(url)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
          Upload Image
        </h2>
        <UploadForm onUploaded={handleUploaded} eventId={eventId} />
      </div>

      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-400 mb-3">
        Uploaded Images ({images.length})
      </h2>

      {images.length === 0 ? (
        <p className="text-gray-500 text-sm">No images uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {images.map((img) => (
            <div key={img.filename} className="rounded-lg border bg-white overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.filename}
                className="w-full h-32 object-cover bg-gray-100"
              />
              <div className="p-2">
                <p className="text-xs text-gray-500 truncate mb-1">{img.filename}</p>
                <button
                  onClick={() => copyUrl(img.url)}
                  className="text-xs underline text-blue-600"
                >
                  {copied === img.url ? 'Copied!' : 'Copy URL'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
