# Scavenger Hunt

A self-hosted, QR-code-driven scavenger hunt platform for conferences, trade shows, museums, and campus events. Participants collect points by scanning checkpoints; organisers manage everything through a built-in admin panel.

[![License: AGPL-3.0](https://img.shields.io/badge/License-AGPL%20v3-blue.svg)](https://www.gnu.org/licenses/agpl-3.0)
[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js&logoColor=white)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14+-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org)

---

## Screenshots

<table>
  <tr>
    <td align="center"><strong>Participant — Join</strong><br><img src="docs/imgs/participant-join.png" alt="Participant join page" width="340"></td>
    <td align="center"><strong>Participant — Checkpoint list</strong><br><img src="docs/imgs/participant-home.png" alt="Participant home page" width="340"></td>
  </tr>
  <tr>
    <td align="center"><strong>Participant — Check-in</strong><br><img src="docs/imgs/participant-checkin.png" alt="Check-in page" width="340"></td>
    <td align="center"><strong>Admin — Event &amp; checkpoints</strong><br><img src="docs/imgs/admin-event-detail.png" alt="Admin event detail" width="340"></td>
  </tr>
  <tr>
    <td align="center"><strong>Admin — Checkpoint analytics</strong><br><img src="docs/imgs/admin-checkpoint-dashboard.png" alt="Checkpoint dashboard" width="340"></td>
    <td align="center"><strong>Admin — Hunter management</strong><br><img src="docs/imgs/admin-hunter-dashboard.png" alt="Hunter dashboard" width="340"></td>
  </tr>
  <tr>
    <td align="center"><strong>Admin — Conversion tracking</strong><br><img src="docs/imgs/admin-conversions.png" alt="Conversion tracking" width="340"></td>
    <td align="center"><strong>Admin — Event branding</strong><br><img src="docs/imgs/admin-event-branding.png" alt="Event branding editor" width="340"></td>
  </tr>
</table>

---

## Features

### Participant experience
- **No app required** — works entirely in the phone browser; participants join with a display name, no account needed
- **Live checkpoint list** — all stops on one page, sorted by organiser order, with collapsible clue accordions
- **Seven checkpoint types** — on-site sponsors, off-site sponsors, exhibits, interactive trivia, online actions, prize redemption, and general event stops
- **In-app QR scanner** — floating camera button lets participants scan without leaving the page
- **Trivia / question mechanic** — exhibits and sponsors can require a correct answer before awarding points; supports multiple accepted answers and radio-button or free-text input
- **Prize redemption flow** — dedicated page shows final score and confirms hunt completion for staff verification
- **In-app browser detection** — sticky banner prompts iOS users in Instagram/Discord/etc. to open in Safari

### Organiser / admin panel
- **Multi-event management** — create and manage any number of independent events from one panel
- **JSON bulk import** — paste or upload a JSON payload to create or update an entire event and all its checkpoints in one step; re-import safely at any time (upsert by slug)
- **Drag-and-drop checkpoint reordering** — control the exact order participants see on the home page
- **Print-ready QR sheets** — generate a full QR code sheet for the whole event in one click
- **Sponsor conversion tracking** — AUTO (timed redirect) and MANUAL (button click) conversion events logged per checkpoint, visible in a dedicated conversions dashboard
- **Custom branding per event** — logo, primary colour, header background image
- **Custom branding per checkpoint** — sponsor logo, background image, blurb, and custom type tag label
- **URL obscuration** — replace readable slugs with random strings to prevent participants guessing checkpoint URLs
- **Hunter dashboard** — view all participants with scores, check-in history, and enable/disable controls
- **Checkpoint dashboard** — scan counts, last-scan timestamps, live active/inactive toggles
- **Image asset manager** — upload and reuse images across events from within the admin panel
- **Email OTP login** — no stored passwords; admins log in via a one-time code to a whitelisted address

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16.2](https://nextjs.org) — App Router, Server Actions, Edge Middleware |
| Language | TypeScript 5 |
| Database | PostgreSQL via [Prisma 7](https://www.prisma.io) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com) |
| Drag-and-drop | [@dnd-kit](https://dndkit.com) |
| QR decoding | [jsQR](https://github.com/cozmo/jsQR) |
| QR generation | [qrcode](https://github.com/soldair/node-qrcode) |
| Email (OTP) | [Nodemailer](https://nodemailer.com) |
| Runtime | Node.js 20+ |
| Package manager | [pnpm](https://pnpm.io) |

---

## Quick start

### Prerequisites

- **Node.js 20+**
- **PostgreSQL 14+**
- **pnpm** — `npm install -g pnpm`
- An **SMTP account** for admin login emails (Gmail app password, Resend, Mailgun, etc.)

### 1 — Clone and install

```bash
git clone https://github.com/your-username/scavenger-hunt.git
cd scavenger-hunt
pnpm install
```

### 2 — Configure environment

```bash
cp .env.example .env
```

Edit `.env` and fill in the required values:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://user:password@localhost:5432/scavenger_hunt"

# Random secret for signing admin session tokens
# Generate one with: pnpm generate-secret
ADMIN_SECRET="replace-with-a-long-random-string"

# SMTP settings for admin OTP login emails
SMTP_HOST="smtp.example.com"
SMTP_PORT="587"
SMTP_USER="user@example.com"
SMTP_PASS="your-smtp-password"
SMTP_FROM="noreply@example.com"
```

Interactive setup scripts are available for each step:

```bash
pnpm db-setup        # guided database connection setup
pnpm smtp-setup      # guided SMTP configuration
pnpm generate-secret # generate and save a new ADMIN_SECRET
```

### 3 — Run migrations

```bash
pnpm exec prisma migrate deploy
pnpm exec prisma generate
```

### 4 — Create the admin account

```bash
pnpm reset-admin
```

Follow the prompts to set your admin email address and add it to the login whitelist.

### 5 — Start the app

```bash
# Development (hot reload)
pnpm dev

# Production
pnpm build
pnpm start
```

The app runs at `http://localhost:3000`.  
Admin panel: `http://localhost:3000/admin`

---

## Creating your first event

1. Log in at `/admin` — enter your whitelisted email and use the OTP from your inbox
2. Click **New Event**, fill in the name, slug, and optional branding
3. Add checkpoints manually via **Add Checkpoint**, or bulk-import with **Import JSON**
4. Print QR codes from the event detail page and place them at your venue
5. Share the participant link (`/event/your-slug`) with attendees

See [`docs/CHECKPOINT_FORMAT.md`](docs/CHECKPOINT_FORMAT.md) for the full import format reference and a copy-paste example covering every checkpoint type.

---

## Utility scripts

| Command | Description |
|---|---|
| `pnpm db-setup` | Guided database connection setup |
| `pnpm smtp-setup` | Guided SMTP configuration |
| `pnpm generate-secret` | Generate and save a new `ADMIN_SECRET` |
| `pnpm whitelist-add <email>` | Add an email to the admin login whitelist |
| `pnpm whitelist-remove <email>` | Remove an email from the whitelist |
| `pnpm reset-admin` | Clear all admin accounts and reset the whitelist |
| `pnpm seed` | Seed the database with sample event data |

---

## Production deployment

For a full guide covering EC2, PM2, Nginx reverse proxy, and Cloudflare SSL, see [`docs/AWS_DEPLOYMENT.md`](docs/AWS_DEPLOYMENT.md).

Key points for any deployment:
- Build in the same OS environment you deploy to (native Node modules are platform-specific)
- Run `pnpm exec prisma generate` after every `pnpm install` on the server
- Set `NODE_ENV=production` — this enables the `Secure` flag on session cookies
- Serve over HTTPS; admin sessions will not persist correctly over plain HTTP in production

---

## Documentation

| Document | Description |
|---|---|
| [`docs/CHECKPOINT_FORMAT.md`](docs/CHECKPOINT_FORMAT.md) | Full JSON import format reference — all checkpoint types, fields, and copy-paste templates |
| [`docs/example-event.json`](docs/example-event.json) | Complete example payload with every checkpoint type and every optional field |
| [`docs/AWS_DEPLOYMENT.md`](docs/AWS_DEPLOYMENT.md) | Production deployment guide — EC2, Nginx, Cloudflare, PM2 |

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

---

## License

[GNU Affero General Public License v3.0](LICENSE) — free to self-host and modify. Any publicly hosted version must make its source code available to users under the same terms.
