/**
 * Interactive SMTP configuration wizard.
 * Writes SMTP_* values to .env and optionally sends a test email.
 *
 * Usage: pnpm smtp-setup
 */

import { createInterface } from 'readline/promises'
import { createTransport } from 'nodemailer'
import { getEnvValue, setEnvValue } from './lib/env'

const rl = createInterface({ input: process.stdin, output: process.stdout })

async function ask(prompt: string, fallback?: string): Promise<string> {
  const hint = fallback ? ` (${fallback})` : ''
  const answer = (await rl.question(`${prompt}${hint}: `)).trim()
  return answer || fallback || ''
}

async function askSecret(prompt: string): Promise<string> {
  // Node doesn't natively hide input, so we just label it clearly
  process.stdout.write(`${prompt} (input visible — run in a private terminal): `)
  const answer = await new Promise<string>((resolve) => {
    process.stdin.once('data', (chunk) => resolve(chunk.toString().trim()))
  })
  return answer
}

async function main() {
  console.log('\n── SMTP Setup ────────────────────────────────────────')
  console.log('Configures the email account used to send 2FA codes.\n')

  // Offer Gmail shortcut
  const useGmail = (await ask('Use Gmail? [y/N]')).toLowerCase() === 'y'

  let host: string, port: string, secure: string

  if (useGmail) {
    host   = 'smtp.gmail.com'
    port   = '587'
    secure = 'false'
    console.log('ℹ  Gmail preset applied (smtp.gmail.com:587, STARTTLS).')
    console.log('   Make sure you use a Google App Password, not your account password.')
    console.log('   Generate one at: myaccount.google.com → Security → App passwords\n')
  } else {
    host   = await ask('SMTP host', getEnvValue('SMTP_HOST'))
    port   = await ask('SMTP port', getEnvValue('SMTP_PORT') ?? '587')
    secure = (await ask('Use TLS on connect (port 465)? [y/N]')).toLowerCase() === 'y'
      ? 'true' : 'false'
  }

  const user = await ask('SMTP username (email)', getEnvValue('SMTP_USER'))
  const pass = await ask('SMTP password / app password', getEnvValue('SMTP_PASS'))
  const from = await ask('From address', getEnvValue('SMTP_FROM') ?? user)

  // Write to .env
  setEnvValue('SMTP_HOST',   host)
  setEnvValue('SMTP_PORT',   port)
  setEnvValue('SMTP_SECURE', secure)
  setEnvValue('SMTP_USER',   user)
  setEnvValue('SMTP_PASS',   pass)
  setEnvValue('SMTP_FROM',   from)

  console.log('\n✔  SMTP settings saved to .env.')

  // Optional test send
  const doTest = (await ask('\nSend a test email now? [y/N]')).toLowerCase() === 'y'
  if (doTest) {
    const to = await ask('Send test to', user)
    rl.close()

    console.log(`\nSending test email to ${to} …`)
    try {
      const transporter = createTransport({
        host,
        port: Number(port),
        secure: secure === 'true',
        auth: { user, pass },
      })
      await transporter.sendMail({
        from,
        to,
        subject: 'Scavenger Hunt — SMTP test',
        text: 'SMTP is configured correctly. You are ready to use admin 2FA.',
      })
      console.log('✔  Test email sent successfully. Check your inbox.')
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`✘  Failed to send: ${message}`)
      console.error('   Double-check your credentials and try again.')
    }
  } else {
    rl.close()
    console.log('   Skipped. Run pnpm smtp-setup again to test at any time.')
  }
}

main()
