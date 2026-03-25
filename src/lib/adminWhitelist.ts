/**
 * Admin enrolment whitelist — stored in AdminSetting (key: adminAllowedEmails).
 * Falls back to the ADMIN_ALLOWED_EMAILS env var so initial deployment via
 * .env / pnpm whitelist-add still works before anyone has logged in.
 *
 * All functions are Node-only (use Prisma).
 */

import { db } from '@/lib/db'

const SETTING_KEY = 'adminAllowedEmails'

/** Returns the current whitelist, or an empty array if unrestricted. */
export async function getWhitelist(): Promise<string[]> {
  const setting = await db.adminSetting.findUnique({ where: { key: SETTING_KEY } })
  const source = setting?.value ?? process.env.ADMIN_ALLOWED_EMAILS ?? ''
  return source
    ? source.split(',').map((e) => e.trim().toLowerCase()).filter(Boolean)
    : []
}

/**
 * Returns true if the email is permitted to enrol.
 * If neither DB nor env var has a list, any email is allowed.
 */
export async function isEmailAllowed(email: string): Promise<boolean> {
  const list = await getWhitelist()
  if (list.length === 0) return true
  return list.includes(email.trim().toLowerCase())
}

/** Adds an email to the DB whitelist (no-op if already present). */
export async function addToWhitelist(email: string): Promise<void> {
  const list = await getWhitelist()
  const normalised = email.trim().toLowerCase()
  if (!list.includes(normalised)) list.push(normalised)
  await db.adminSetting.upsert({
    where:  { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: list.join(',') },
    update: { value: list.join(',') },
  })
}

/** Removes an email from the DB whitelist (no-op if not present). */
export async function removeFromWhitelist(email: string): Promise<void> {
  const list = await getWhitelist()
  const updated = list.filter((e) => e !== email.trim().toLowerCase())
  await db.adminSetting.upsert({
    where:  { key: SETTING_KEY },
    create: { key: SETTING_KEY, value: updated.join(',') },
    update: { value: updated.join(',') },
  })
}
