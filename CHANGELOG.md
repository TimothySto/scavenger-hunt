# Changelog

All notable changes to this project are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

---

## [1.0.0] — 2026-05-06

Initial public release.

### Participant features
- Cookie-based sessions — join with a display name, no account required
- Event home page with live checkpoint list, clue accordions, and real-time score display
- Check-in pages for all checkpoint types with sponsor branding support
- Trivia / question mechanic — correct-answer gate before points are awarded
- Multiple accepted answers and radio-button or free-text answer input
- Sponsor redirect splash with AUTO conversion tracking on correct answer
- In-app QR scanner — floating camera button using `getUserMedia` and jsQR
- Prize redemption flow — final score confirmation page for staff verification
- In-app browser detection banner (Instagram, Discord, and other iOS WebViews)
- Root domain smart redirect — routes to active event join or home page based on session state

### Admin features
- Multi-event management panel
- Event branding editor — logo URL, primary colour, header background image
- Image asset manager — upload and reuse images across events
- Seven checkpoint types: `ONSITE_SPONSOR`, `OFFSITE_SPONSOR`, `EXHIBIT`, `EXHIBIT_QUESTION`, `ONLINE_ONLY`, `PRIZE_REDEMPTION`, `EVENT_GENERAL`
- Per-checkpoint configuration: points, clue, sponsor logo, background image, blurb, redirect URL, question, answer choices, custom tag label
- Drag-and-drop checkpoint reordering (order persists to participant view)
- URL obscuration — replace readable slugs with random strings
- JSON bulk import — upsert an entire event and all checkpoints from a single payload
- Print-ready QR code sheet generation
- Checkpoint analytics dashboard — scan counts, last-scan timestamps, active/inactive toggles
- Hunter management dashboard — participant list with scores, check-in history, enable/disable controls
- Conversion tracking dashboard — AUTO and MANUAL conversion events per checkpoint
- Email OTP admin login — no stored passwords; whitelisted email + one-time code
- Admin session management — 8-hour sliding expiry, stored in database

### Infrastructure
- Next.js 16.2 App Router with Server Actions and Edge Middleware
- Prisma 7 with PostgreSQL
- Interactive CLI setup scripts for database, SMTP, and secret generation
- Webpack production build for portable cross-environment deployment
- `force-dynamic` on database pages to prevent build-time prerender errors
- `tsx` in production dependencies so utility scripts run on the server without `devDependencies`
