'use client'

import { useState } from 'react'
import ImagePickerField from '@/components/admin/ImagePickerField'
import { updateLandingPage } from './actions'

type ImageItem = { filename: string; url: string }

type Props = {
  eventId: string
  name: string
  description: string | null
  logoUrl: string | null
  backgroundImage: string
  ctaText: string
  conversionBonusPoints: number
  images: ImageItem[]
}

export default function LandingPageForm({
  eventId, name, description, logoUrl, backgroundImage: initBg, ctaText: initCta,
  conversionBonusPoints, images,
}: Props) {
  const [logoValue, setLogoValue] = useState(logoUrl ?? '')
  const [bgValue, setBgValue] = useState(initBg)
  const [saved, setSaved] = useState(false)

  const action = updateLandingPage.bind(null, eventId)

  async function handleSubmit(formData: FormData) {
    formData.set('logoUrl', logoValue)
    formData.set('backgroundImage', bgValue)
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
        <label className="block text-sm font-medium mb-1">Event Name</label>
        <input
          name="name"
          defaultValue={name}
          required
          className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          name="description"
          defaultValue={description ?? ''}
          rows={3}
          placeholder="Brief description shown below the event name"
          className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <ImagePickerField label="Event Logo" value={logoValue} onChange={setLogoValue} images={images} eventId={eventId} />
      <ImagePickerField label="Background Image" value={bgValue} onChange={setBgValue} images={images} eventId={eventId} />

      <div>
        <label className="block text-sm font-medium mb-1">
          Join Button Text{' '}
          <span className="font-normal text-gray-400">(default: "Join the Hunt →")</span>
        </label>
        <input
          name="ctaText"
          defaultValue={initCta}
          placeholder="Join the Hunt →"
          className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div className="rounded-lg border bg-amber-50 border-amber-200 p-5 space-y-3">
        <div>
          <label className="block text-sm font-medium mb-1">
            Manual Conversion Bonus{' '}
            <span className="font-normal text-gray-500">(pts)</span>
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Bonus points awarded when a hunter clicks the sponsor link manually before the auto-redirect fires.
            Set to 0 to disable.
          </p>
          <input
            name="conversionBonusPoints"
            type="number"
            min={0}
            defaultValue={conversionBonusPoints}
            className="w-32 rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
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
