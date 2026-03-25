import Link from 'next/link'
import { cookies } from 'next/headers'
import { db } from '@/lib/db'
import { getAccountFromSession } from '@/lib/adminSession'
import { ADMIN_COOKIE_NAME } from '@/lib/adminAuth'
import { changeEmail, changePassword } from './actions'

type Props = {
  searchParams: Promise<{ error?: string; success?: string }>
}

const errorMessages: Record<string, string> = {
  wrong:    'Current password is incorrect.',
  mismatch: 'New passwords do not match.',
  short:    'New password must be at least 8 characters.',
  taken:    'That email address is already in use.',
  same:     'New email is the same as the current email.',
}

const successMessages: Record<string, string> = {
  password: 'Password updated successfully.',
  email:    'Email address updated successfully.',
}

export default async function SettingsPage({ searchParams }: Props) {
  const { error, success } = await searchParams

  // Resolve current account for display
  const jar = await cookies()
  const token = jar.get(ADMIN_COOKIE_NAME)?.value ?? ''
  const accountId = await getAccountFromSession(token)
  const account = accountId
    ? await db.adminAccount.findUnique({ where: { id: accountId } })
    : null

  return (
    <main className="p-8 max-w-lg space-y-8">
      <div>
        <Link href="/admin" className="text-sm text-gray-500 underline">
          ← Back to Admin
        </Link>
        <h1 className="text-2xl font-bold mt-2">Settings</h1>
        {account && (
          <p className="text-sm text-gray-500 mt-1">Signed in as {account.email}</p>
        )}
      </div>

      {/* ── Feedback banner ───────────────────────────────────── */}
      {success && (
        <div className="rounded bg-green-50 border border-green-200 px-3 py-2 text-sm text-green-700">
          {successMessages[success] ?? 'Saved.'}
        </div>
      )}
      {error && (
        <div className="rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
          {errorMessages[error] ?? 'Something went wrong.'}
        </div>
      )}

      {/* ── Change email ──────────────────────────────────────── */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="font-semibold text-lg mb-1">Change Email</h2>
        <p className="text-sm text-gray-500 mb-5">
          This is the address used for login and where verification codes are sent.
        </p>

        <form action={changeEmail} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="new-email">
              New email address
            </label>
            <input
              id="new-email"
              name="newEmail"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="email-password">
              Current password (to confirm)
            </label>
            <input
              id="email-password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-sm text-white font-medium hover:bg-gray-800 transition-colors"
          >
            Update email
          </button>
        </form>
      </section>

      {/* ── Change password ───────────────────────────────────── */}
      <section className="rounded-lg border bg-white p-6">
        <h2 className="font-semibold text-lg mb-1">Change Password</h2>
        <p className="text-sm text-gray-500 mb-5">
          Choose a strong password of at least 8 characters.
        </p>

        <form action={changePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="current">
              Current password
            </label>
            <input
              id="current"
              name="current"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="next">
              New password
            </label>
            <input
              id="next"
              name="next"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1" htmlFor="confirm">
              Confirm new password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              required
              autoComplete="new-password"
              className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <button
            type="submit"
            className="rounded bg-black px-4 py-2 text-sm text-white font-medium hover:bg-gray-800 transition-colors"
          >
            Update password
          </button>
        </form>
      </section>
    </main>
  )
}
