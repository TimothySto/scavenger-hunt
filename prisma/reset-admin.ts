/**
 * Clears all admin accounts, sessions, and pending codes.
 * Run with: pnpm reset-admin
 *
 * Safe to run at any time — event, checkpoint, and participant data is untouched.
 * After running, navigate to /admin/setup to create a fresh admin account.
 */

import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! })
const db = new PrismaClient({ adapter })

async function main() {
  const { count } = await db.adminAccount.deleteMany()
  await db.$disconnect()

  if (count === 0) {
    console.log('No admin accounts found — nothing to clear.')
  } else {
    console.log(`Cleared ${count} admin account(s). Sessions and pending codes removed via cascade.`)
    console.log('Navigate to /admin/setup to create a new account.')
  }
}

main()
