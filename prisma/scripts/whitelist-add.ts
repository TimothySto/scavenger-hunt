/**
 * Adds an email address to the ADMIN_ALLOWED_EMAILS whitelist.
 *
 * Usage:
 *   pnpm whitelist-add you@example.com
 *   pnpm whitelist-add          ← prompts interactively
 */

import { createInterface } from 'readline/promises'
import { getEnvValue, setEnvValue } from './lib/env'

async function main() {
  let email = process.argv[2]?.trim().toLowerCase()

  if (!email) {
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    email = (await rl.question('Email to add: ')).trim().toLowerCase()
    rl.close()
  }

  if (!email || !email.includes('@')) {
    console.error('Error: please provide a valid email address.')
    process.exit(1)
  }

  const current = getEnvValue('ADMIN_ALLOWED_EMAILS')
  const list = current ? current.split(',').map((e) => e.trim()).filter(Boolean) : []

  if (list.includes(email)) {
    console.log(`ℹ  ${email} is already in the whitelist.`)
    console.log(`   Current list: ${list.join(', ')}`)
    process.exit(0)
  }

  list.push(email)
  setEnvValue('ADMIN_ALLOWED_EMAILS', list.join(','))

  console.log(`✔  Added ${email} to the whitelist.`)
  console.log(`   Current list: ${list.join(', ')}`)
}

main()
