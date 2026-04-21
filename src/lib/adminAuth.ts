// Edge-compatible HMAC utilities — safe to import from middleware.
// DB operations live in adminSession.ts (Node only).

export const ADMIN_COOKIE_NAME   = 'admin_session'
export const PENDING_COOKIE_NAME = 'admin_pending'

// Session duration for the sliding window refresh
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000 // 8 hours

// ── HMAC key ─────────────────────────────────────────────────────────────────

async function getHmacKey(): Promise<CryptoKey> {
  const secret = process.env.ADMIN_SECRET ?? 'fallback-dev-secret'
  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

// ── Token format:  {id}.{base64url-hmac(id)} ─────────────────────────────────
// id is a cuid (no dots), so lastIndexOf('.') reliably splits them.

export async function createSignedToken(id: string): Promise<string> {
  const key = await getHmacKey()
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(id))
  // Use base64url (no +, /, or = chars) so the token is safe in cookies without percent-encoding
  const b64url = btoa(String.fromCharCode(...new Uint8Array(sig)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
  return `${id}.${b64url}`
}

export async function verifySignedToken(token: string): Promise<string | null> {
  try {
    const dot = token.lastIndexOf('.')
    if (dot === -1) return null
    const id  = token.slice(0, dot)
    const sig = token.slice(dot + 1)
    const key = await getHmacKey()
    // Decode base64url back to standard base64 before atob
    const b64 = sig.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - sig.length % 4) % 4)
    const sigBytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0))
    const ok = await crypto.subtle.verify(
      'HMAC', key, sigBytes,
      new TextEncoder().encode(id)
    )
    return ok ? id : null
  } catch {
    return null
  }
}
