// Node.js server-only — never import from middleware/edge code.
// All DB session management and OTP logic lives here.

import { createHash, timingSafeEqual, randomInt } from 'crypto'
import { db } from '@/lib/db'
import { createSignedToken, verifySignedToken, SESSION_DURATION_MS } from '@/lib/adminAuth'

const OTP_DURATION_MS = 10 * 60 * 1000 // 10 minutes

// ── Sessions ─────────────────────────────────────────────────────────────────

export async function createAdminSession(adminAccountId: string): Promise<string> {
  const session = await db.adminSession.create({
    data: {
      adminAccountId,
      expiresAt: new Date(Date.now() + SESSION_DURATION_MS),
    },
  })
  return createSignedToken(session.id)
}

/** Validates signature, checks DB expiry, extends sliding window. Returns true if valid. */
export async function validateAndRefreshSession(token: string): Promise<boolean> {
  const sessionId = await verifySignedToken(token)
  if (!sessionId) return false

  const session = await db.adminSession.findUnique({ where: { id: sessionId } })
  if (!session) return false

  if (session.expiresAt < new Date()) {
    await db.adminSession.delete({ where: { id: sessionId } }).catch(() => {})
    return false
  }

  // Extend sliding window
  await db.adminSession.update({
    where: { id: sessionId },
    data: {
      expiresAt:    new Date(Date.now() + SESSION_DURATION_MS),
      lastActiveAt: new Date(),
    },
  })

  return true
}

/** Returns the AdminAccount ID for a valid session, or null. */
export async function getAccountFromSession(token: string): Promise<string | null> {
  const sessionId = await verifySignedToken(token)
  if (!sessionId) return null

  const session = await db.adminSession.findUnique({ where: { id: sessionId } })
  if (!session || session.expiresAt < new Date()) return null

  return session.adminAccountId
}

export async function deleteAdminSession(token: string): Promise<void> {
  const sessionId = await verifySignedToken(token)
  if (!sessionId) return
  await db.adminSession.delete({ where: { id: sessionId } }).catch(() => {})
}

// ── OTP pending codes ─────────────────────────────────────────────────────────

export async function createPendingCode(
  adminAccountId: string
): Promise<{ pendingToken: string; plainCode: string }> {
  // 6-digit code, zero-padded
  const plainCode = randomInt(100000, 1000000).toString()
  const codeHash  = createHash('sha256').update(plainCode).digest('hex')

  // Remove any stale pending codes for this account first
  await db.adminPendingCode.deleteMany({ where: { adminAccountId } })

  const pending = await db.adminPendingCode.create({
    data: {
      adminAccountId,
      codeHash,
      expiresAt: new Date(Date.now() + OTP_DURATION_MS),
    },
  })

  const pendingToken = await createSignedToken(pending.id)
  return { pendingToken, plainCode }
}

/**
 * Validates a pending token + OTP code.
 * Returns the adminAccountId on success, null on any failure.
 * Deletes the code on success (one-time use).
 */
export async function verifyPendingCode(
  pendingToken: string,
  inputCode: string
): Promise<string | null> {
  const pendingId = await verifySignedToken(pendingToken)
  if (!pendingId) return null

  const pending = await db.adminPendingCode.findUnique({ where: { id: pendingId } })
  if (!pending) return null

  if (pending.expiresAt < new Date()) {
    await db.adminPendingCode.delete({ where: { id: pendingId } }).catch(() => {})
    return null
  }

  const inputHash = createHash('sha256').update(inputCode.trim()).digest('hex')
  const a = Buffer.from(inputHash)
  const b = Buffer.from(pending.codeHash)
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null

  // One-time use — delete immediately
  await db.adminPendingCode.delete({ where: { id: pendingId } }).catch(() => {})

  return pending.adminAccountId
}
