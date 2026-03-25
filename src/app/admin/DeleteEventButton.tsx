'use client'

import { deleteEvent } from './events/actions'

export function DeleteEventButton({ eventId, eventName }: { eventId: string; eventName: string }) {
  return (
    <form action={deleteEvent}>
      <input type="hidden" name="eventId" value={eventId} />
      <button
        type="submit"
        className="rounded border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors"
        onClick={(e) => {
          if (!confirm(`Permanently delete "${eventName}" and all its checkpoints and participant data?\n\nThis cannot be undone.`))
            e.preventDefault()
        }}
      >
        Delete event
      </button>
    </form>
  )
}
