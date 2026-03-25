import Link from 'next/link'
import { importEventJson } from './actions'

const exampleJson = `{
  "event": {
    "name": "Spring Hunt 2026",
    "slug": "spring-hunt-2026",
    "description": "Annual campus scavenger hunt",
    "logoUrl": null,
    "isActive": true
  },
  "checkpoints": [
    {
      "name": "Welcome Table",
      "type": "ONSITE_SPONSOR",
      "points": 10,
      "clue": "Find us at the main entrance",
      "fallbackUrl": "https://example.com",
      "contentJson": {
        "blurb": "Thanks for visiting our table!"
      },
      "isActive": true
    },
    {
      "name": "Online Sponsor",
      "type": "ONLINE_ONLY",
      "points": 5,
      "fallbackUrl": "https://sponsor-website.com",
      "contentJson": {
        "blurb": "Click through to visit our site and earn points!"
      },
      "isActive": true
    },
    {
      "name": "Prize Redemption",
      "type": "PRIZE_REDEMPTION",
      "points": 0,
      "contentJson": {
        "prizeInstructions": "Show this screen to the prize table volunteer to claim your reward."
      },
      "isActive": true
    }
  ]
}`

export default function ImportPage() {
  return (
    <main className="p-8 max-w-3xl">
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-gray-500 underline">
          ← Back to Admin
        </Link>
        <h1 className="text-2xl font-bold mt-2">Import Event JSON</h1>
        <p className="text-sm text-gray-500 mt-1">
          Paste a JSON payload to create or update an event and its checkpoints.
          Existing records are matched by <code className="bg-gray-100 px-1 rounded">slug</code> (event) and{' '}
          <code className="bg-gray-100 px-1 rounded">qrCodeValue</code> (checkpoints) and upserted.
        </p>
      </div>

      <div className="mb-6 rounded-xl border bg-amber-50 border-amber-200 p-4 text-sm text-amber-800 space-y-1">
        <p className="font-semibold">Supported checkpoint types</p>
        <ul className="list-disc list-inside space-y-0.5 text-amber-700">
          <li><code>ONSITE_SPONSOR</code> — QR at physical table; auto-checks-in and redirects to fallbackUrl</li>
          <li><code>OFFSITE_SPONSOR</code> — same UX as onsite, QR in printed/offsite materials</li>
          <li><code>EXHIBIT</code> — QR at an exhibit station; optional question mechanic via contentJson</li>
          <li><code>EXHIBIT_QUESTION</code> — always uses question mechanic; always linked from homepage</li>
          <li><code>ONLINE_ONLY</code> — linked directly from hunt homepage, no physical QR</li>
          <li><code>PRIZE_REDEMPTION</code> — shows score summary and completes the hunt; set points to 0</li>
          <li><code>EVENT_GENERAL</code> — general event checkpoint (welcome table, info booth, etc.)</li>
        </ul>
        <p className="font-semibold pt-1">Supported contentJson keys</p>
        <ul className="list-disc list-inside space-y-0.5 text-amber-700">
          <li><code>sponsorLogo</code> — URL to logo shown on check-in page</li>
          <li><code>backgroundImage</code> — URL to background image for check-in page</li>
          <li><code>blurb</code> — short text shown on check-in page</li>
          <li><code>prizeInstructions</code> — text shown on prize redemption page</li>
          <li><code>question</code> — question text (EXHIBIT / EXHIBIT_QUESTION)</li>
          <li><code>correctAnswer</code> — correct answer string, case-insensitive</li>
          <li><code>answerChoices</code> — array of strings; shows radio buttons instead of free text</li>
          <li><code>questionMode</code> — true: show homepage link for EXHIBIT type</li>
          <li><code>showTag</code> — false: hide the type badge on the participant homepage</li>
        </ul>
      </div>

      <form action={importEventJson} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">JSON Payload</label>
          <textarea
            name="json"
            className="w-full rounded border px-3 py-2 font-mono text-xs"
            rows={28}
            defaultValue={exampleJson}
            required
          />
        </div>

        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Import Event
        </button>
      </form>
    </main>
  )
}
