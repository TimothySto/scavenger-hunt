export const SESSION_COOKIE_NAME = 'scavenger_session'

export function createSessionId() {
  return crypto.randomUUID()
}