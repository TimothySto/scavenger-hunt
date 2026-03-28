# Scavenger Hunt Platform

A self-hosted QR code scavenger hunt platform for live events. Participants scan QR codes placed around a venue to earn points, answer questions, and interact with exhibits — all from their phone browser, no app install required.

---

## Overview

### Participants
- Join an event by name — no account or app required
- Browse checkpoints and hints from a branded event homepage
- Scan QR codes to check in and earn points
- Answer questions at interactive exhibit checkpoints

### Administrators
- Create and manage multiple simultaneous events
- Configure checkpoints with points, clues, question prompts, and custom branding
- Generate print-ready QR code sheets per event
- Monitor participation live via hunter and checkpoint dashboards
- Adjust points manually and manage participant sessions
- Manage additional admin accounts from the Settings page — no server access required
- Secure login with email 2FA and auto-expiring sessions
- Logged-in account email displayed in the admin header on every page

---

## Requirements

- **Node.js** 18 or later
- **pnpm** (`npm install -g pnpm`)
- **PostgreSQL** 14 or later
- An **SMTP account** for admin 2FA email delivery (Gmail with an App Password works well)

---

## Quick Start

### 1. Clone and install

```bash
git clone https://github.com/TimothySto/scavenger-hunt.git
cd scavenger-hunt
pnpm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` directly, or use the interactive setup scripts:

```bash
pnpm db-setup          # set your database connection string
pnpm smtp-setup        # configure email delivery
pnpm generate-secret   # generate a secure signing secret
```

See `.env.example` for the full list of variables.

### 3. Set up the database

```bash
pnpm exec prisma migrate deploy
pnpm exec prisma generate
```

### 4. Start the application

```bash
# Development
pnpm dev

# Production
pnpm build && pnpm start
```

### 5. Create the first admin account

Open `http://localhost:3000/admin/setup` in your browser to enrol the first administrator. The setup page locks itself after the first account is created.

Additional admin accounts can be created from **Admin → Settings → Admin Accounts** once you are logged in. Adding an account automatically adds that email to the enrolment whitelist; removing an account removes it from the whitelist. No server access or CLI scripts are needed for day-to-day admin management.

---

## Environment Variables

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string |
| `ADMIN_SECRET` | Secret used to sign session tokens — generate with `pnpm generate-secret` |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP port (typically `587`) |
| `SMTP_SECURE` | `true` for port 465, `false` for STARTTLS |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password or app password |
| `SMTP_FROM` | From address used for 2FA emails |
| `ADMIN_ALLOWED_EMAILS` | *(Optional)* Comma-separated list of emails permitted to create admin accounts. Leave unset during initial setup, then restrict once your account is created. |

---

## Utility Scripts

| Command | Description |
|---|---|
| `pnpm db-setup` | Interactively configure `DATABASE_URL` |
| `pnpm smtp-setup` | Interactively configure SMTP settings |
| `pnpm generate-secret` | Generate and write a new `ADMIN_SECRET` |
| `pnpm whitelist-add <email>` | Add an email to the admin enrolment whitelist |
| `pnpm whitelist-remove <email>` | Remove an email from the whitelist |
| `pnpm reset-admin` | Clear all admin accounts and re-enable `/admin/setup` |
| `pnpm seed` | Populate the database with sample event data |

---

## Checkpoint Types

| Type | Use case |
|---|---|
| `ONSITE_SPONSOR` | Physical sponsor booth with a QR code |
| `OFFSITE_SPONSOR` | Sponsor with an external URL to visit |
| `EXHIBIT` | Display or exhibit, optionally with a question |
| `EXHIBIT_QUESTION` | Interactive exhibit, always question-based |
| `ONLINE_ONLY` | Online action with a destination link |
| `PRIZE_REDEMPTION` | Staff-scanned prize collection point |
| `EVENT_GENERAL` | General activity (registration desk, welcome table, etc.) |

---

## Security Notes

- Admin login requires email + password followed by a 6-digit OTP sent to the registered email address
- Sessions are stored in the database and expire after 8 hours of inactivity
- The enrolment whitelist is stored in the database at runtime — `ADMIN_ALLOWED_EMAILS` in `.env` is only used as a bootstrap fallback before any accounts exist
- Additional admins are managed from the Settings page; adding or removing an account keeps the whitelist in sync automatically
- Rotate `ADMIN_SECRET` before deploying to a public server (`pnpm generate-secret`)
- Serve the application over HTTPS in any internet-facing deployment

---

## License

MIT
