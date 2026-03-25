import { login } from './actions'

type Props = {
  searchParams: Promise<{ error?: string; from?: string }>
}

const errorMessages: Record<string, string> = {
  credentials: 'Incorrect email or password. Please try again.',
  send: 'Failed to send verification email. Please try again.',
}

export default async function LoginPage({ searchParams }: Props) {
  const { error, from } = await searchParams

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg border shadow-sm p-8">
          <h1 className="text-xl font-bold mb-1">Admin</h1>
          <p className="text-sm text-gray-500 mb-6">Scavenger Hunt Dashboard</p>

          {error && (
            <div className="mb-4 rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {errorMessages[error] ?? 'Something went wrong. Please try again.'}
            </div>
          )}

          <form action={login} className="space-y-4">
            <input type="hidden" name="from" value={from ?? '/admin'} />

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
                autoComplete="current-password"
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded bg-black px-4 py-2 text-sm text-white font-medium hover:bg-gray-800 transition-colors"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
