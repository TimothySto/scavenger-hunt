/**
 * Generates a new cryptographically secure ADMIN_SECRET and writes it to .env.
 * Run this once when setting up a new environment.
 *
 * Usage: pnpm generate-secret
 */

import { randomBytes } from 'crypto'
import { getEnvValue, setEnvValue } from './lib/env'

const current = getEnvValue('ADMIN_SECRET')
const isPlaceholder = !current || current.startsWith('replace-this')

if (!isPlaceholder) {
  console.log('⚠  ADMIN_SECRET is already set.')
  console.log('   If you rotate it, all existing admin sessions will be invalidated immediately.')
  console.log('   Re-run with --force to replace it anyway.\n')

  if (!process.argv.includes('--force')) {
    process.exit(0)
  }
}

const secret = randomBytes(32).toString('hex')
setEnvValue('ADMIN_SECRET', secret)

console.log('✔  New ADMIN_SECRET written to .env.')
if (!isPlaceholder) {
  console.log('   All active admin sessions have been invalidated — everyone must log in again.')
}
