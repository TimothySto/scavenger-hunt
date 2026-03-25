'use client'

import { useState } from 'react'
import ImagePickerField from '@/components/admin/ImagePickerField'
import { updateHomePage } from './actions'

type ImageItem = { filename: string; url: string }

type Props = {
  eventId: string
  announcement: string
  backgroundImage: string
  showRecoveryCode: boolean
  recoveryCodeTitle: string
  recoveryCodeSubtext: string
  images: ImageItem[]
}

export default function HomePageForm({
  eventId, announcement, backgroundImage: initBg,
  showRecoveryCode: initShow, recoveryCodeTitle: initTitle, recoveryCodeSubtext: initSubtext,
  images,
}: Props) {
  const [bgValue, setBgValue] = useState(initBg)
  const [showCode, setShowCode] = useState(initShow)
  const [saved, setSaved] = useState(false)

  const action = updateHomePage.bind(null, eventId)

  async function handleSubmit(formData: FormData) {
    formData.set('backgroundImage', bgValue)
    formData.set('showRecoveryCode', showCode ? 'true' : 'false')
    await action(formData)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      {saved && (
        <div className="rounded bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
          Saved successfully.
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-1">
          Announcement Banner{' '}
          <span className="font-normal text-gray-400">(optional — shown at top of the homepage)</span>
        </label>
        <textarea
          name="announcement"
          defaultValue={announcement}
          rows={3}
          placeholder="e.g. Prize draw at 4 PM near the main stage!"
          className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <ImagePickerField label="Background Image" value={bgValue} onChange={setBgValue} images={images} eventId={eventId} />

      {/* Recovery Code Frame */}
      <div className="rounded-lg border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Recovery Code Frame</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <span className="text-sm text-gray-600">Show on homepage</span>
            <button
              type="button"
              role="switch"
              aria-checked={showCode}
              onClick={() => setShowCode((v) => !v)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black ${showCode ? 'bg-black' : 'bg-gray-300'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${showCode ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </label>
        </div>

        <div className={showCode ? '' : 'opacity-50 pointer-events-none'}>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Title</label>
              <input
                name="recoveryCodeTitle"
                defaultValue={initTitle}
                placeholder="Your Recovery Code — screenshot this!"
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Subtext</label>
              <textarea
                name="recoveryCodeSubtext"
                defaultValue={initSubtext}
                rows={2}
                placeholder="If you lose your progress, show this code to an organizer to restore your session."
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>
          </div>
        </div>
      </div>

      <button
        type="submit"
        className="rounded bg-black px-5 py-2.5 text-sm text-white font-medium hover:bg-gray-800 transition-colors"
      >
        Save Changes
      </button>
    </form>
  )
}
