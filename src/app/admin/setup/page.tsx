import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { createAccount } from './actions'

type Props = {
  searchParams: Promise<{ error?: string }>
}

const errorMessages: Record<string, string> = {
  exists:     'An admin account already exists. Please sign in.',
  short:      'Password must be at least 8 characters.',
  mismatch:   'Passwords do not match.',
  notallowed: 'That email address is not authorised to create an admin account.',
}

export default async function SetupPage({ searchParams }: Props) {
  // Only accessible when no accounts exist
  const count = await db.adminAccount.count()
  if (count > 0) {
    redirect('/admin/login')
  }

  const { error } = await searchParams

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg border shadow-sm p-8">
          <h1 className="text-xl font-bold mb-1">Create admin account</h1>
          <p className="text-sm text-gray-500 mb-6">
            No admin accounts exist yet. Set up your credentials to get started.
          </p>

          {error && (
            <div className="mb-4 rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {errorMessages[error] ?? 'Something went wrong.'}
            </div>
          )}

          <form action={createAccount} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="confirm">
                Confirm password
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
              className="w-full rounded bg-black px-4 py-2 text-sm text-white font-medium hover:bg-gray-800 transition-colors"
            >
              Create account
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
