# Checkpoint Import Format

This document describes the JSON format used to import events and checkpoints via the admin import tool at `/admin/import`.

---

## Top-level structure

```json
{
  "event": { ... },
  "checkpoints": [ ... ]
}
```

The importer **upserts** records — if an event with the same `slug` or a checkpoint with the same `qrCodeValue` already exists, it is updated rather than duplicated. This makes the format safe to re-import after edits.

---

## Event object

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Display name of the event |
| `slug` | string | ✅ | URL-safe identifier — used in all participant-facing URLs (`/event/{slug}/home`) |
| `description` | string | — | Short description shown on the landing page |
| `logoUrl` | string (URL) | — | URL to the event logo image |
| `isActive` | boolean | — | Whether the event is open to participants. Defaults to `true` |

```json
"event": {
  "name": "Spring Hunt 2026",
  "slug": "spring-hunt-2026",
  "description": "Annual campus scavenger hunt.",
  "logoUrl": "https://assets.example.com/logo.png",
  "isActive": true
}
```

---

## Checkpoint object

| Field | Type | Required | Description |
|---|---|---|---|
| `name` | string | ✅ | Display name shown on the homepage and check-in page |
| `type` | enum | ✅ | Checkpoint behaviour type — see [Checkpoint Types](#checkpoint-types) |
| `points` | integer ≥ 0 | ✅ | Points awarded on check-in |
| `slug` | string | — | URL-safe identifier. Auto-generated from `name` if omitted |
| `qrCodeValue` | string | — | The value encoded in the QR code. Auto-generated as `/checkin/{eventSlug}/{slug}` if omitted. **Use this to match existing checkpoints on re-import** |
| `clue` | string | — | Hint text shown in the collapsed checkpoint accordion on the homepage |
| `fallbackUrl` | string (URL) | — | Sponsor website URL. Triggers the AUTO conversion redirect flow |
| `isActive` | boolean | — | Whether the checkpoint is visible to participants. Defaults to `true` |
| `contentJson` | object | — | Type-specific content and display options — see [contentJson fields](#contentjson-fields) |

> **Note on `_template`**: The example file uses a `_template` comment field on each entry. The importer ignores unknown fields, so these are safe to leave in or remove.

---

## Checkpoint types

### `ONSITE_SPONSOR`
A sponsor with a physical table at the event. A QR code is placed at the table. When a hunter scans it:
1. Their visit is logged (check-in created)
2. They see the check-in page (logo, blurb, points gained)
3. After a short delay they are automatically redirected to `fallbackUrl` (AUTO conversion logged)
4. A manual "Visit website" button is also shown as a backup (MANUAL conversion if clicked)

**Typical use:** Trade show sponsors, exhibitor tables, booth check-ins.

---

### `OFFSITE_SPONSOR`
Identical check-in UX to `ONSITE_SPONSOR`. The difference is presentation only — the participant homepage shows a note that the QR code is "in their onsite materials" rather than expecting a physical table.

**Typical use:** Sponsors who provide branded lanyards, booklets, or other printed materials containing the QR code, but do not have a staffed table.

---

### `EXHIBIT`
A QR code placed at an exhibit or display station. On scan, the hunter gets a standard instant check-in by default.

**Optional question mechanic:** Populate `question` and `correctAnswer` in `contentJson` to require hunters to answer correctly before earning points. Set `questionMode: true` to also show a direct link on the participant homepage (so hunters can answer without scanning).

**Typical use:** Museum-style exhibits, interactive displays, information panels.

---

### `EXHIBIT_QUESTION`
Always uses the question mechanic — there is no standard instant check-in path for this type. A direct link is always shown on the participant homepage. Best used for purely knowledge-based checkpoints that do not require physical presence.

`question` and `correctAnswer` in `contentJson` are required for this type to function correctly.

**Typical use:** Trivia questions, knowledge challenges, virtual exhibits.

---

### `ONLINE_ONLY`
No physical QR code. The checkpoint appears on the participant homepage as a tappable link. Clicking it logs the check-in and redirects to `fallbackUrl` (AUTO conversion). A manual "Visit website" button is also shown.

**Typical use:** Online-only sponsors, social media follow actions, digital content partners.

---

### `PRIZE_REDEMPTION`
A special checkpoint scanned at the prize/redemption desk. Instead of a standard check-in page, it shows:
- The hunter's current score and checkpoint count
- A confirmation button to officially complete the hunt
- Redirects to the final results page on confirmation

**Set `points` to `0`** — prize redemption is not itself a scoring checkpoint.

**Typical use:** End-of-hunt prize desk, redemption counter.

---

### `EVENT_GENERAL`
A general-purpose checkpoint for any event stop that is not sponsor-related. Behaves the same as `ONSITE_SPONSOR` at the UX level but carries an "Event" type tag rather than "Sponsor", and carries no sponsorship connotations.

**Typical use:** Welcome table, organiser info booth, activity stations, mandatory stops.

---

## contentJson fields

All `contentJson` fields are optional unless noted. Unknown fields are stored but ignored by the UI.

| Field | Type | Applicable types | Description |
|---|---|---|---|
| `sponsorLogo` | string (URL) | All | Logo image shown on the check-in page header |
| `backgroundImage` | string (URL) | All | Full-bleed background image for the check-in page |
| `blurb` | string | All | Short paragraph shown on the check-in page below the logo |
| `prizeInstructions` | string | `PRIZE_REDEMPTION` | Instructions shown on the prize redemption page |
| `question` | string | `EXHIBIT`, `EXHIBIT_QUESTION` | Question text displayed to the hunter |
| `correctAnswer` | string | `EXHIBIT`, `EXHIBIT_QUESTION` | Accepted answer. Comparison is **case-insensitive and whitespace-trimmed** |
| `answerChoices` | string[] | `EXHIBIT`, `EXHIBIT_QUESTION` | If provided, shows radio buttons. If omitted, shows a free-text input |
| `questionMode` | boolean | `EXHIBIT` | `true` — show a direct homepage link so hunters can answer without scanning the QR code |
| `showTag` | boolean | All | `false` — hide the type badge on the participant homepage. Defaults to `true` (shown) |

---

## Copy-paste templates

### Onsite sponsor (quick)
```json
{
  "name": "Sponsor Name",
  "type": "ONSITE_SPONSOR",
  "points": 10,
  "fallbackUrl": "https://sponsor-website.com",
  "isActive": true,
  "contentJson": {
    "blurb": "Thanks for visiting our table!"
  }
}
```

### Offsite sponsor (quick)
```json
{
  "name": "Sponsor Name",
  "type": "OFFSITE_SPONSOR",
  "points": 10,
  "fallbackUrl": "https://sponsor-website.com",
  "clue": "Find our QR code in the event booklet.",
  "isActive": true
}
```

### Exhibit — scan only
```json
{
  "name": "Exhibit Name",
  "type": "EXHIBIT",
  "points": 15,
  "clue": "Located in the east wing.",
  "isActive": true,
  "contentJson": {
    "blurb": "Welcome to this exhibit."
  }
}
```

### Exhibit — with trivia question
```json
{
  "name": "Exhibit Name",
  "type": "EXHIBIT",
  "points": 15,
  "clue": "Located in the east wing.",
  "isActive": true,
  "contentJson": {
    "blurb": "Read the panel, then answer the question.",
    "question": "Your question here?",
    "correctAnswer": "Your answer",
    "answerChoices": ["Option A", "Option B", "Option C", "Option D"],
    "questionMode": true
  }
}
```

### Interactive question (homepage link, no QR required)
```json
{
  "name": "Question Name",
  "type": "EXHIBIT_QUESTION",
  "points": 20,
  "isActive": true,
  "contentJson": {
    "question": "Your question here?",
    "correctAnswer": "Your answer",
    "answerChoices": ["Option A", "Option B", "Option C", "Option D"]
  }
}
```

### Online-only sponsor
```json
{
  "name": "Online Sponsor",
  "type": "ONLINE_ONLY",
  "points": 5,
  "fallbackUrl": "https://sponsor-website.com",
  "isActive": true,
  "contentJson": {
    "blurb": "Click through to visit our site and earn points!"
  }
}
```

### Prize redemption desk
```json
{
  "name": "Prize Desk",
  "type": "PRIZE_REDEMPTION",
  "points": 0,
  "isActive": true,
  "contentJson": {
    "prizeInstructions": "Show this screen to a volunteer to claim your prize."
  }
}
```

### Event general (welcome table, info booth, etc.)
```json
{
  "name": "Welcome Table",
  "type": "EVENT_GENERAL",
  "points": 5,
  "clue": "Start here at the front entrance.",
  "isActive": true,
  "contentJson": {
    "blurb": "Welcome! Grab a programme and get scanning.",
    "showTag": false
  }
}
```

---

## Full event import example

The following is a minimal but complete import payload that creates one of each checkpoint type. Paste it into the import tool at `/admin/import` to create a test event.

```json
{
  "event": {
    "name": "Demo Hunt",
    "slug": "demo-hunt",
    "description": "A demo event with one of every checkpoint type.",
    "isActive": true
  },
  "checkpoints": [
    {
      "name": "Welcome Table",
      "type": "EVENT_GENERAL",
      "points": 5,
      "clue": "Start here at the front entrance.",
      "isActive": true,
      "contentJson": { "blurb": "Welcome! Grab a programme and get scanning.", "showTag": false }
    },
    {
      "name": "Acme Corp",
      "type": "ONSITE_SPONSOR",
      "points": 10,
      "clue": "Find us near the main entrance.",
      "fallbackUrl": "https://www.example.com",
      "isActive": true,
      "contentJson": { "blurb": "Thanks for stopping by the Acme Corp booth!" }
    },
    {
      "name": "Globex Industries",
      "type": "OFFSITE_SPONSOR",
      "points": 10,
      "clue": "Check the sponsor booklet from registration.",
      "fallbackUrl": "https://www.example.com",
      "isActive": true
    },
    {
      "name": "Science Exhibit",
      "type": "EXHIBIT",
      "points": 15,
      "clue": "Located in the east wing, room 3B.",
      "isActive": true,
      "contentJson": { "blurb": "Welcome to the science exhibit." }
    },
    {
      "name": "History Quiz",
      "type": "EXHIBIT_QUESTION",
      "points": 20,
      "isActive": true,
      "contentJson": {
        "question": "In what year did the first moon landing occur?",
        "correctAnswer": "1969",
        "answerChoices": ["1965", "1967", "1969", "1972"]
      }
    },
    {
      "name": "Digital Partner",
      "type": "ONLINE_ONLY",
      "points": 5,
      "fallbackUrl": "https://www.example.com",
      "isActive": true,
      "contentJson": { "blurb": "Click through to visit our site!" }
    },
    {
      "name": "Prize Desk",
      "type": "PRIZE_REDEMPTION",
      "points": 0,
      "isActive": true,
      "contentJson": { "prizeInstructions": "Show this screen to a volunteer to claim your prize." }
    }
  ]
}
```

---

## Notes for admins

- **Slugs are auto-generated** from the checkpoint name if you leave `slug` blank. Spaces and special characters are converted to hyphens and lowercased.
- **QR code values are auto-generated** as `/checkin/{eventSlug}/{slug}` if you leave `qrCodeValue` blank. On re-import, include the `qrCodeValue` from the first import to update rather than duplicate.
- **`fallbackUrl` drives conversion tracking** — only checkpoints with a `fallbackUrl` show conversion columns in the checkpoint dashboard.
- **`correctAnswer` matching is forgiving** — leading/trailing whitespace is stripped and comparison is case-insensitive, so `"1969"`, `" 1969 "`, and `"1969 "` all match.
- **`showTag: false`** is useful for event-infrastructure checkpoints (welcome table, prize desk) where the type badge would feel out of place to participants.
- **The `_template` key** used in `checkpoint-examples.json` is ignored by the importer and is just a human-readable label. You can leave it in or remove it freely.
