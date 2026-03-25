'use client'

import { removeAdminAccount } from './actions'

export function RemoveAdminButton({ targetId, email }: { targetId: string; email: string }) {
  return (
    <form action={removeAdminAccount}>
      <input type="hidden" name="targetId" value={targetId} />
      <button
        type="submit"
        className="rounded border border-red-200 px-2 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors"
        onClick={(e) => {
          if (!confirm(`Remove admin account for ${email}?`)) e.preventDefault()
        }}
      >
        Remove
      </button>
    </form>
  )
}
