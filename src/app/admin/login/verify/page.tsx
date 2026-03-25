import { verifyOtp } from './actions'

type Props = {
  searchParams: Promise<{ error?: string; from?: string }>
}

const errorMessages: Record<string, string> = {
  expired: 'The verification code has expired or is invalid. Please sign in again.',
  invalid: 'Incorrect code. Please check the email and try again.',
}

export default async function VerifyPage({ searchParams }: Props) {
  const { error, from } = await searchParams

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-lg border shadow-sm p-8">
          <h1 className="text-xl font-bold mb-1">Verify your identity</h1>
          <p className="text-sm text-gray-500 mb-6">
            A 6-digit code was sent to your email address. Enter it below to continue.
          </p>

          {error && (
            <div className="mb-4 rounded bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {errorMessages[error] ?? 'Something went wrong. Please try again.'}
            </div>
          )}

          <form action={verifyOtp} className="space-y-4">
            <input type="hidden" name="from" value={from ?? '/admin'} />

            <div>
              <label className="block text-sm font-medium mb-1" htmlFor="code">
                Verification code
              </label>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{6}"
                maxLength={6}
                required
                autoFocus
                autoComplete="one-time-code"
                placeholder="000000"
                className="w-full rounded border px-3 py-2 text-sm text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-black"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded bg-black px-4 py-2 text-sm text-white font-medium hover:bg-gray-800 transition-colors"
            >
              Sign in
            </button>
          </form>

          <p className="mt-4 text-xs text-gray-400 text-center">
            Didn&apos;t receive a code?{' '}
            <a href="/admin/login" className="underline hover:text-gray-700">
              Go back and try again
            </a>
          </p>
        </div>
      </div>
    </main>
  )
}
