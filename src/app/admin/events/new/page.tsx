'use client'

import { useState } from 'react'
import { createEvent } from './actions'

function toSlug(value: string) {
  return value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
}

export default function NewEventPage() {
  const [slug, setSlug] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)

  function handleNameChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!slugTouched) {
      setSlug(toSlug(e.target.value))
    }
  }

  return (
    <main className="p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Create Event</h1>

      <form action={createEvent} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Name</label>
          <input
            name="name"
            className="w-full rounded border px-3 py-2"
            required
            onChange={handleNameChange}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Slug</label>
          <input
            name="slug"
            className="w-full rounded border px-3 py-2"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true)
              setSlug(e.target.value)
            }}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            name="description"
            className="w-full rounded border px-3 py-2"
            rows={4}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">
            Event Logo URL <span className="font-normal text-gray-400">(optional)</span>
          </label>
          <input
            name="logoUrl"
            type="url"
            placeholder="https://... or /uploads/filename.png"
            className="w-full rounded border px-3 py-2"
          />
        </div>

        <label className="flex items-center gap-2">
          <input type="checkbox" name="isActive" defaultChecked />
          <span>Active</span>
        </label>

        <button
          type="submit"
          className="rounded bg-black px-4 py-2 text-white"
        >
          Create Event
        </button>
      </form>
    </main>
  )
}
