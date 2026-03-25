/**
 * Interactive database configuration wizard.
 * Writes DATABASE_URL to .env, tests the connection, and reminds you to migrate.
 *
 * Usage: pnpm db-setup
 */

import { createInterface } from 'readline/promises'
import { Client } from 'pg'
import { getEnvValue, setEnvValue } from './lib/env'

const rl = createInterface({ input: process.stdin, output: process.stdout })

async function ask(prompt: string, fallback?: string): Promise<string> {
  const hint = fallback ? ` (${fallback})` : ''
  const answer = (await rl.question(`${prompt}${hint}: `)).trim()
  return answer || fallback || ''
}

async function testConnection(url: string): Promise<void> {
  const client = new Client({ connectionString: url })
  await client.connect()
  const res = await client.query('SELECT current_database(), current_user, version()')
  const row = res.rows[0]
  console.log(`   Database : ${row.current_database}`)
  console.log(`   User     : ${row.current_user}`)
  console.log(`   Server   : ${row.version.split(' ').slice(0, 2).join(' ')}`)
  await client.end()
}

async function main() {
  console.log('\n── Database Setup ────────────────────────────────────')
  console.log('Configures the PostgreSQL connection for this application.\n')

  const currentUrl = getEnvValue('DATABASE_URL')

  const mode = (await ask(
    'Enter [1] full connection string  or  [2] individual fields',
    '1'
  ))

  let url: string

  if (mode === '2') {
    const host   = await ask('Host',     'localhost')
    const port   = await ask('Port',     '5432')
    const dbname = await ask('Database name')
    const user   = await ask('Username')
    const pass   = await ask('Password')
    const schema = await ask('Schema',   'public')
    url = `postgresql://${user}:${pass}@${host}:${port}/${dbname}?schema=${schema}`
    console.log(`\n   Connection string: ${url}`)
  } else {
    url = await ask('Connection string', currentUrl)
  }

  if (!url) {
    console.error('Error: no connection string provided.')
    rl.close()
    process.exit(1)
  }

  // Test the connection before saving
  const doTest = (await ask('\nTest connection before saving? [Y/n]')).toLowerCase() !== 'n'

  if (doTest) {
    console.log('\nConnecting …')
    try {
      await testConnection(url)
      console.log('✔  Connection successful.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`✘  Connection failed: ${message}`)
      const save = (await ask('\nSave anyway? [y/N]')).toLowerCase() === 'y'
      if (!save) {
        rl.close()
        console.log('Aborted — .env not changed.')
        process.exit(1)
      }
    }
  }

  rl.close()
  setEnvValue('DATABASE_URL', url)
  console.log('\n✔  DATABASE_URL saved to .env.')
  console.log('\nNext steps:')
  console.log('  pnpm exec prisma migrate deploy   ← apply migrations to the database')
  console.log('  pnpm exec prisma generate         ← regenerate Prisma client if needed')
}

main()
