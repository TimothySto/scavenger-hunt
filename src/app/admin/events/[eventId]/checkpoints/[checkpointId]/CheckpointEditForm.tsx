'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { updateCheckpoint, obscureCheckpointUrl, restoreCheckpointUrl } from './actions'
import ImagePickerField from '@/components/admin/ImagePickerField'

type ImageItem = { filename: string; url: string }

type ContentJson = {
  sponsorLogo?: string
  backgroundImage?: string
  blurb?: string
  prizeInstructions?: string
  question?: string
  correctAnswer?: string
  answerChoices?: string[]
  acceptedAnswers?: string[]
  questionMode?: boolean
  enableQuestion?: boolean
  showTag?: boolean
  customTag?: string
  isObscured?: boolean
  originalSlug?: string
}

type Props = {
  checkpointId: string
  eventId: string
  name: string
  type: string
  points: number
  clue: string | null
  fallbackUrl: string | null
  isActive: boolean
  content: ContentJson
  images: ImageItem[]
  currentSlug: string
  eventSlug: string
}

export default function CheckpointEditForm({
  checkpointId,
  eventId,
  name,
  type,
  points,
  clue,
  fallbackUrl,
  isActive,
  content,
  images,
  currentSlug,
  eventSlug,
}: Props) {
  const router = useRouter()
  const [checkpointType, setCheckpointType] = useState(type)
  const [sponsorLogo, setSponsorLogo] = useState(content.sponsorLogo ?? '')
  const [backgroundImage, setBackgroundImage] = useState(content.backgroundImage ?? '')
  const [questionMode, setQuestionMode] = useState(content.questionMode ?? false)
  const [enableQuestion, setEnableQuestion] = useState(content.enableQuestion ?? false)
  const [showTag, setShowTag] = useState(content.showTag !== false)
  const [overrideTag, setOverrideTag] = useState(!!(content.customTag))
  const [saved, setSaved] = useState(false)
  const [obscuring, startObscure] = useTransition()

  const isExhibit          = checkpointType === 'EXHIBIT'
  const isExhibitQuestion  = checkpointType === 'EXHIBIT_QUESTION'
  const isSponsor          = checkpointType === 'ONSITE_SPONSOR'
  const hasQuestionSection = isExhibit || isExhibitQuestion || (isSponsor && enableQuestion)

  const action = updateCheckpoint.bind(null, checkpointId, eventId)

  async function handleSubmit(formData: FormData) {
    formData.set('sponsorLogo', sponsorLogo)
    formData.set('backgroundImage', backgroundImage)
    formData.set('questionMode', questionMode ? 'true' : 'false')
    formData.set('enableQuestion', enableQuestion ? 'true' : 'false')
    formData.set('showTag', showTag ? 'true' : 'false')
    await action(formData)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <form action={handleSubmit} className="space-y-6">

      {saved && (
        <div className="rounded bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
          Saved successfully.
        </div>
      )}

      {/* Core fields */}
      <div className="rounded-lg border bg-white p-5 space-y-4">
        <h2 className="font-semibold">Checkpoint Details</h2>

        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              name="name"
              defaultValue={name}
              required
              className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
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
              defaultValue={points}
              required
              className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Redirect URL</label>
            <input
              name="fallbackUrl"
              type="url"
              defaultValue={fallbackUrl ?? ''}
              placeholder="https://sponsor-website.com"
              className="w-full rounded border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">Clue</label>
            <textarea
              name="clue"
              defaultValue={clue ?? ''}
              rows={2}
              className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={overrideTag}
                onChange={(e) => setOverrideTag(e.target.checked)}
                className="h-4 w-4"
              />
              <span className="text-sm font-medium">Override tag label</span>
            </label>
            {overrideTag && (
              <input
                name="customTag"
                defaultValue={content.customTag ?? ''}
                placeholder="e.g. Partner, Interactive, Exhibit…"
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            )}
          </div>

          <div className="col-span-2 flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" name="isActive" defaultChecked={isActive} className="h-4 w-4" />
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
            {isSponsor && (
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableQuestion}
                  onChange={(e) => setEnableQuestion(e.target.checked)}
                  className="h-4 w-4"
                />
                <span className="text-sm font-medium">Enable question on check-in</span>
              </label>
            )}
          </div>

          {/* URL obscuration */}
          <div className="col-span-2 rounded-lg border border-gray-200 bg-gray-50 p-4 space-y-2">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                  Checkpoint URL
                  {content.isObscured && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 normal-case tracking-normal">
                      🔒 Obscured
                    </span>
                  )}
                </p>
                <p className="text-xs font-mono text-gray-600 break-all">
                  /checkin/{eventSlug}/{currentSlug}
                </p>
                {content.isObscured && content.originalSlug && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Original: /checkin/{eventSlug}/{content.originalSlug}
                  </p>
                )}
              </div>
              <button
                type="button"
                disabled={obscuring}
                onClick={() => {
                  startObscure(async () => {
                    if (content.isObscured) {
                      await restoreCheckpointUrl(checkpointId, eventId)
                    } else {
                      await obscureCheckpointUrl(checkpointId, eventId)
                    }
                    router.refresh()
                  })
                }}
                className={`flex-shrink-0 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors disabled:opacity-50 ${
                  content.isObscured
                    ? 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                    : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
                }`}
              >
                {obscuring
                  ? 'Updating…'
                  : content.isObscured
                  ? 'Restore Original URL'
                  : 'Obscure URL'}
              </button>
            </div>
            <p className="text-xs text-gray-400">
              {content.isObscured
                ? 'URL is randomised. QR codes and links now use the obscured slug. Restore to revert to the readable URL.'
                : 'Replace the human-readable slug with a random string to prevent participants from guessing or sharing checkpoint URLs.'}
            </p>
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
            defaultValue={content.blurb ?? ''}
            rows={3}
            placeholder="Short message shown on the check-in page"
            className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Prize Instructions</label>
          <textarea
            name="prizeInstructions"
            defaultValue={content.prizeInstructions ?? ''}
            rows={3}
            placeholder="Shown on prize redemption page (PRIZE_REDEMPTION type only)"
            className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>
      </div>

      {/* Question section — EXHIBIT, EXHIBIT_QUESTION, and ONSITE_SPONSOR with enableQuestion */}
      {hasQuestionSection && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 space-y-4">
          <div>
            <h2 className="font-semibold text-blue-900">
              {isExhibitQuestion ? 'Interactive Question' : isSponsor ? 'Sponsor Question' : 'Exhibit Question'}
            </h2>
            <p className="text-xs text-blue-700 mt-0.5">
              {isExhibitQuestion
                ? 'This checkpoint type always uses a question. Participants answer to earn points.'
                : isSponsor
                ? 'Participants must answer correctly when they scan this checkpoint\'s QR code.'
                : 'Participants must answer correctly to earn points. Leave blank to use standard instant check-in.'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Question</label>
            <textarea
              name="question"
              defaultValue={content.question ?? ''}
              rows={2}
              placeholder="e.g. What year was this company founded?"
              className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Correct Answer</label>
            <input
              name="correctAnswer"
              defaultValue={content.correctAnswer ?? ''}
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
              defaultValue={(content.answerChoices ?? []).join('\n')}
              rows={4}
              placeholder={"1975\n1980\n1985\n1990"}
              className="w-full rounded border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              If provided, participants see radio buttons. If blank, they type a free-text answer.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">
              Additional Accepted Answers{' '}
              <span className="font-normal text-gray-500">(optional — one per line)</span>
            </label>
            <textarea
              name="acceptedAnswers"
              defaultValue={(content.acceptedAnswers ?? []).join('\n')}
              rows={3}
              placeholder={"alternate spelling\nabbreviation"}
              className="w-full rounded border px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-black bg-white"
            />
            <p className="text-xs text-gray-500 mt-1">
              All answers are case-insensitive. Add alternate spellings or abbreviations here.
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
        Save Changes
      </button>
    </form>
  )
}
