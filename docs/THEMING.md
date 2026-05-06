# Event Theming

Each event can be fully branded through the **Branding** editor at `/admin/events/[eventId]/tools/branding`. All style settings are stored in the `styleJson` column of the Event record and apply to every participant-facing page for that event.

---

## Where theming applies

| Page | Affected by theming |
|---|---|
| Landing page (`/event/[slug]`) | Logo, background image, CTA text, colours, fonts |
| Welcome page (`/event/[slug]/welcome`) | Logo, background image, rules text, CTA button |
| Home / checkpoint list (`/event/[slug]/home`) | Logo, colours, fonts, announcement banner, background image |
| Check-in pages (`/checkin/[slug]/[checkpoint]`) | Event logo (fallback only; checkpoint branding takes precedence) |
| Hunt complete page (`/event/[slug]/complete`) | Logo, primary colour, fonts |

---

## Event logo

Set on the **Event** record directly (not in `styleJson`):

| Field | Description |
|---|---|
| `logoUrl` | URL of the event logo. Displayed at the top of the home page, landing page, and welcome page. Also used as the browser tab favicon. |

The logo is loaded from any publicly accessible URL. Use the admin image upload tool to host images on your own server, then paste the resulting URL.

---

## Colours

All colours are hex strings (`#rrggbb`). Each colour has a paired `*Alpha` field (0–100) that controls opacity.

| Field | Default | Description |
|---|---|---|
| `primaryColor` | `#111827` | Button background colour; QR scanner button; score accent on completion page |
| `primaryAlpha` | `100` | Opacity of the primary colour (0 = transparent, 100 = fully opaque) |
| `accentColor` | `#f59e0b` | Accent boxes, highlighted borders, and accent text |
| `accentAlpha` | `100` | Opacity of the accent colour |
| `backgroundColor` | `#f9fafb` | Page background colour |
| `backgroundAlpha` | `100` | Opacity of the background colour |

Button text colour (black or white) is calculated automatically for maximum contrast against `primaryColor`.

---

## Typography

### Global font

| Field | Default | Description |
|---|---|---|
| `fontFamily` | `Inter` | Font family for all participant pages |
| `fontBold` | `false` | Apply bold weight globally |
| `fontItalic` | `false` | Apply italic style globally |

Available font families (loaded from Google Fonts):

| Value | Display name |
|---|---|
| `Inter` | Inter |
| `Poppins` | Poppins |
| `Roboto` | Roboto |
| `Montserrat` | Montserrat |
| `Playfair Display` | Playfair Display |
| `Merriweather` | Merriweather |

### Text elements

Individual text roles can each have their own size, colour, and style overrides. These are stored in `styleJson.textElements`.

| Key | Applies to | Default size |
|---|---|---|
| `heading` | Main event title on the home page | `3xl` |
| `subtitle` | "Playing as…" subtitle | `sm` |
| `label` | Small caps labels (e.g. "Recovery Code") | `xs` |
| `body` | Checkpoint names and clue text | `sm` |
| `code` | Recovery code display | `3xl` |
| `score` | Large score / points number | `6xl` |

Each text element accepts:

| Sub-field | Type | Description |
|---|---|---|
| `size` | string | One of: `xs`, `sm`, `base`, `lg`, `xl`, `2xl`, `3xl`, `4xl`, `5xl`, `6xl` |
| `color` | string (hex) | Text colour |
| `bold` | boolean | Bold weight |
| `italic` | boolean | Italic style |
| `uppercase` | boolean | Text transform uppercase |

---

## Landing page

The landing page is the first page a new participant sees when they follow the event link (`/event/[slug]`).

| Field | Default | Description |
|---|---|---|
| `landingBackgroundImage` | `""` | Full-bleed background image URL |
| `landingCtaText` | `""` | Custom label for the join button. If empty, a default label is shown |

---

## Home page

| Field | Default | Description |
|---|---|---|
| `homeBackgroundImage` | `""` | Full-bleed background image URL for the home page |
| `homeAnnouncement` | `""` | Announcement text displayed in a banner at the top of the home page |
| `showRecoveryCode` | `true` | Show or hide the recovery code section |
| `recoveryCodeTitle` | `"Your Recovery Code — screenshot this!"` | Heading shown above the recovery code |
| `recoveryCodeSubtext` | `"If you lose your progress, show this code to an organizer to restore your session."` | Explanatory text below the recovery code |

---

## Welcome page

An optional intermediate page shown after joining and before the home page. Useful for displaying event rules or a welcome message.

| Field | Default | Description |
|---|---|---|
| `showWelcomePage` | `false` | Enable the welcome page. When `false`, participants go directly to the home page after joining |
| `welcomeBackgroundImage` | `""` | Full-bleed background image URL |
| `welcomeRulesText` | `""` | Freeform rules / welcome text (plain text, line breaks preserved) |
| `welcomeCtaText` | `"Start the Hunt →"` | Label for the button that advances to the home page |

---

## Admin panel accent

These fields style the event-specific pages in the admin panel, keeping the admin UI visually consistent with the event brand without affecting participant pages.

| Field | Default | Description |
|---|---|---|
| `adminFontFamily` | same as `fontFamily` | Font for admin event pages |
| `adminAccentColor` | `#111827` | Accent/link colour on admin event pages |

---

## Defaults

If `styleJson` is `null` or any field is missing, the application falls back to safe defaults. You do not need to provide every field — only override what you want to change.

The full default values are defined in `src/lib/eventTheme.ts` (`DEFAULT_STYLE`).

---

## Per-checkpoint branding

Checkpoint-level branding (sponsor logo, background image, blurb) is separate from event theming and is configured per checkpoint via `contentJson`. See [`CHECKPOINT_FORMAT.md`](CHECKPOINT_FORMAT.md) for details.
