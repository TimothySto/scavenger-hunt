'use client'

import { useState } from 'react'
import { updateWelcomePage } from './actions'
import ImagePickerField from '@/components/admin/ImagePickerField'

type ImageItem = { filename: string; url: string }

type Props = {
  eventId: string
  showWelcomePage: boolean
  welcomeBackgroundImage: string
  welcomeRulesText: string
  welcomeCtaText: string
  images: ImageItem[]
}

export default function WelcomePageForm({
  eventId,
  showWelcomePage: initShow,
  welcomeBackgroundImage: initBg,
  welcomeRulesText: initRules,
  welcomeCtaText: initCta,
  images,
}: Props) {
  const [enabled, setEnabled] = useState(initShow)
  const [bgValue, setBgValue] = useState(initBg)
  const [saved, setSaved] = useState(false)

  const action = updateWelcomePage.bind(null, eventId)

  async function handleSubmit(formData: FormData) {
    formData.set('showWelcomePage', enabled ? 'true' : 'false')
    formData.set('welcomeBackgroundImage', bgValue)
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

      {/* Enable toggle */}
      <div className="rounded-lg border bg-white p-5 flex items-center justify-between">
        <div>
          <p className="font-semibold">Enable Welcome Page</p>
          <p className="text-sm text-gray-500 mt-0.5">
            When on, new participants are sent to this page after joining instead of directly to the homepage.
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          onClick={() => setEnabled((v) => !v)}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-black ${enabled ? 'bg-black' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Content fields */}
      <div className={`space-y-5 ${!enabled ? 'opacity-50 pointer-events-none' : ''}`}>
        <ImagePickerField
          label="Background Image"
          value={bgValue}
          onChange={setBgValue}
          images={images}
          eventId={eventId}
        />

        <div>
          <label className="block text-sm font-medium mb-1">
            Rules / Info Text{' '}
            <span className="font-normal text-gray-400">(optional — shown below the recovery code)</span>
          </label>
          <textarea
            name="welcomeRulesText"
            defaultValue={initRules}
            rows={6}
            placeholder={"e.g. Welcome to the hunt!\n\n• Visit sponsor booths and scan their QR codes.\n• Each checkpoint earns you points.\n• Collect all checkpoints to complete the hunt!"}
            className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
          <p className="text-xs text-gray-400 mt-1">Line breaks are preserved.</p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Button Text{' '}
            <span className="font-normal text-gray-400">(default: "Start the Hunt →")</span>
          </label>
          <input
            name="welcomeCtaText"
            defaultValue={initCta}
            placeholder="Start the Hunt →"
            className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
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
