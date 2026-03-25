'use client'

import { useState } from 'react'
import { createCheckpoint } from './actions'
import ImagePickerField from '@/components/admin/ImagePickerField'

type ImageItem = { filename: string; url: string }

type Props = {
  eventId: string
  eventSlug: string
  images: ImageItem[]
}

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function CheckpointForm({ eventId, eventSlug, images }: Props) {
  const [checkpointType, setCheckpointType] = useState('ONSITE_SPONSOR')
  const [sponsorLogo, setSponsorLogo] = useState('')
  const [backgroundImage, setBackgroundImage] = useState('')
  const [questionMode, setQuestionMode] = useState(false)
  const [showTag, setShowTag] = useState(true)
  const [previewSlug, setPreviewSlug] = useState('')

  const isExhibit         = checkpointType === 'EXHIBIT'
  const isExhibitQuestion = checkpointType === 'EXHIBIT_QUESTION'
  const hasQuestionSection = isExhibit || isExhibitQuestion

  const action = createCheckpoint.bind(null, eventId)

  async function handleSubmit(formData: FormData) {
    formData.set('sponsorLogo', sponsorLogo)
    formData.set('backgroundImage', backgroundImage)
    formData.set('questionMode', questionMode ? 'true' : 'false')
    formData.set('showTag', showTag ? 'true' : 'false')
    await action(formData)
  }

  return (
    <div className="space-y-6">
      <form action={handleSubmit} className="space-y-6">

        {/* Core fields */}
        <div className="rounded-lg border bg-white p-5 space-y-4">
          <h2 className="font-semibold">Checkpoint Details</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                name="name"
                required
                onChange={(e) => setPreviewSlug(toSlug(e.target.value))}
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
              {previewSlug && (
                <p className="mt-1 text-xs text-gray-400 font-mono">
                  /checkin/{eventSlug}/{previewSlug}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select
                name="type"
                value={checkpointType}
                onChange={(e) => setCheckpointType(e.target.value)}
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              >
                <option value="ONSITE_SPONSOR">Onsite Sponsor</option>
                <option value="OFFSITE_SPONSOR">Offsite Sponsor</option>
                <option value="EXHIBIT">Exhibit</option>
                <option value="EXHIBIT_QUESTION">Exhibit — Interactive Question</option>
                <option value="ONLINE_ONLY">Online Only</option>
                <option value="PRIZE_REDEMPTION">Prize Redemption</option>
                <option value="EVENT_GENERAL">Event General</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Points</label>
              <input
                name="points"
                type="number"
                defaultValue={0}
                required
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Redirect URL</label>
              <input
                name="fallbackUrl"
                type="url"
                placeholder="https://sponsor-website.com"
                className="w-full rounded border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium mb-1">Clue</label>
              <textarea
                name="clue"
                rows={2}
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div className="col-span-2 flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" name="isActive" defaultChecked className="h-4 w-4" />
                <span className="text-sm font-medium">Active</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showTag}
                  onChange={(e) => setShowTag(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">Show type tag</span>
              </label>
            </div>
          </div>
        </div>

        {/* Content fields */}
        <div className="rounded-lg border bg-white p-5 space-y-4">
          <h2 className="font-semibold">Check-in Page Content</h2>

          <ImagePickerField
            label="Sponsor Logo"
            value={sponsorLogo}
            onChange={setSponsorLogo}
            images={images}
            eventId={eventId}
          />

          <ImagePickerField
            label="Background Image"
            value={backgroundImage}
            onChange={setBackgroundImage}
            images={images}
            eventId={eventId}
          />

          <div>
            <label className="block text-sm font-medium mb-1">Blurb</label>
            <textarea
              name="blurb"
              rows={3}
              placeholder="Short message shown on the check-in page"
              className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Prize Instructions</label>
            <textarea
              name="prizeInstructions"
              rows={3}
              placeholder="Shown on prize redemption page (PRIZE_REDEMPTION type only)"
              className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>
        </div>

        {/* Exhibit question — shown for EXHIBIT and EXHIBIT_QUESTION types */}
        {hasQuestionSection && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 space-y-4">
            <div>
              <h2 className="font-semibold text-blue-900">
                {isExhibitQuestion ? 'Interactive Question' : 'Exhibit Question'}
              </h2>
              <p className="text-xs text-blue-700 mt-0.5">
                {isExhibitQuestion
                  ? 'This checkpoint type always uses a question. Participants answer to earn points.'
                  : 'Participants must answer correctly to earn points. Leave blank to use standard instant check-in.'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Question</label>
              <textarea
                name="question"
                rows={2}
                placeholder="e.g. What year was this company founded?"
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Correct Answer</label>
              <input
                name="correctAnswer"
                placeholder="e.g. 1985"
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">Case-insensitive, whitespace-trimmed comparison.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Answer Choices{' '}
                <span className="font-normal text-gray-500">(optional — one per line)</span>
              </label>
              <textarea
                name="answerChoices"
                rows={4}
                placeholder={"1975\n1980\n1985\n1990"}
                className="w-full rounded border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black bg-white"
              />
              <p className="text-xs text-gray-500 mt-1">
                If provided, participants see radio buttons. If blank, they type a free-text answer.
              </p>
            </div>

          {/* Question Mode toggle — only relevant for plain EXHIBIT; EXHIBIT_QUESTION is always on */}
          {isExhibit && (
            <div className="border-t border-blue-200 pt-4">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={questionMode}
                  onChange={(e) => setQuestionMode(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded"
                />
                <div>
                  <span className="text-sm font-medium text-blue-900">Question Mode</span>
                  <p className="text-xs text-blue-700 mt-0.5">
                    Show a direct link on the participant homepage so this exhibit can be accessed
                    without scanning the QR code. When off, participants must scan to find the exhibit.
                  </p>
                </div>
              </label>
            </div>
          )}
          </div>
        )}

        <button
          type="submit"
          className="rounded bg-black px-5 py-2.5 text-sm text-white font-medium hover:bg-gray-800 transition-colors"
        >
          Create Checkpoint
        </button>
      </form>

      {/* Preview / QR placeholder */}
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center text-sm text-gray-400">
        Preview and QR code will be available after saving.
      </div>
    </div>
  )
}
