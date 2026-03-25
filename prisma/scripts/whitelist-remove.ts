/**
 * Removes an email address from the ADMIN_ALLOWED_EMAILS whitelist.
 *
 * Usage:
 *   pnpm whitelist-remove you@example.com
 *   pnpm whitelist-remove          ← prompts interactively
 */

import { createInterface } from 'readline/promises'
import { getEnvValue, setEnvValue } from './lib/env'

async function main() {
  const current = getEnvValue('ADMIN_ALLOWED_EMAILS')
  const list = current ? current.split(',').map((e) => e.trim()).filter(Boolean) : []

  if (list.length === 0) {
    console.log('ℹ  The whitelist is empty — no restrictions are in place.')
    process.exit(0)
  }

  let email = process.argv[2]?.trim().toLowerCase()

  if (!email) {
    console.log('Current whitelist:')
    list.forEach((e, i) => console.log(`  ${i + 1}. ${e}`))
    console.log()
    const rl = createInterface({ input: process.stdin, output: process.stdout })
    email = (await rl.question('Email to remove: ')).trim().toLowerCase()
    rl.close()
  }

  if (!list.includes(email)) {
    console.log(`ℹ  ${email} is not in the whitelist.`)
    console.log(`   Current list: ${list.join(', ')}`)
    process.exit(0)
  }

  const updated = list.filter((e) => e !== email)
  setEnvValue('ADMIN_ALLOWED_EMAILS', updated.join(','))

  console.log(`✔  Removed ${email} from the whitelist.`)
  if (updated.length === 0) {
    console.log('   Whitelist is now empty — any email address can enrol.')
  } else {
    console.log(`   Current list: ${updated.join(', ')}`)
  }
}

main()
