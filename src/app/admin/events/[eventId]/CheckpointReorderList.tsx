'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { reorderCheckpoints } from './actions'

const checkpointTypeLabel: Record<string, string> = {
  ONSITE_SPONSOR:   'Onsite Sponsor',
  OFFSITE_SPONSOR:  'Offsite Sponsor',
  EXHIBIT:          'Exhibit',
  EXHIBIT_QUESTION: 'Interactive Question',
  ONLINE_ONLY:      'Online Only',
  PRIZE_REDEMPTION: 'Prize Redemption',
  EVENT_GENERAL:    'Event General',
}

type Checkpoint = {
  id: string
  name: string
  type: string
  points: number
  isActive: boolean
  customTag?: string | null
}

function SortableCheckpoint({ checkpoint, eventId }: { checkpoint: Checkpoint; eventId: string }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: checkpoint.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-lg border bg-white px-4 py-3"
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none select-none"
          aria-label="Drag to reorder"
        >
          ⠿
        </button>
        <span
          className={`h-2 w-2 rounded-full flex-shrink-0 ${checkpoint.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
        />
        <div>
          <span className="font-medium">{checkpoint.name}</span>
          <span className="ml-2 text-xs text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
            {checkpoint.customTag ?? checkpointTypeLabel[checkpoint.type] ?? checkpoint.type.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
      <span className="text-sm text-gray-500 flex-shrink-0">{checkpoint.points} pts</span>
    </div>
  )
}

function LinkCheckpoint({ checkpoint, eventId }: { checkpoint: Checkpoint; eventId: string }) {
  return (
    <Link
      href={`/admin/events/${eventId}/checkpoints/${checkpoint.id}`}
      className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 hover:border-black transition-colors group"
    >
      <div className="flex items-center gap-3">
        <span
          className={`h-2 w-2 rounded-full flex-shrink-0 ${checkpoint.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
        />
        <div>
          <span className="font-medium group-hover:underline">{checkpoint.name}</span>
          <span className="ml-2 text-xs text-gray-400 bg-gray-100 rounded px-1.5 py-0.5">
            {checkpoint.customTag ?? checkpointTypeLabel[checkpoint.type] ?? checkpoint.type.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
      <span className="text-sm text-gray-500 flex-shrink-0">{checkpoint.points} pts</span>
    </Link>
  )
}

export function CheckpointReorderList({
  checkpoints: initial,
  eventId,
}: {
  checkpoints: Checkpoint[]
  eventId: string
}) {
  const [reorderMode, setReorderMode] = useState(false)
  const [checkpoints, setCheckpoints] = useState(initial)
  const [saving, setSaving] = useState(false)

  const sensors = useSensors(useSensor(PointerSensor))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setCheckpoints((prev) => {
      const oldIndex = prev.findIndex((cp) => cp.id === active.id)
      const newIndex = prev.findIndex((cp) => cp.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  async function handleSave() {
    setSaving(true)
    await reorderCheckpoints(eventId, checkpoints.map((cp) => cp.id))
    setSaving(false)
    setReorderMode(false)
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3 mb-3">
        <button
          onClick={() => {
            if (reorderMode) {
              // Cancel — reset to initial order
              setCheckpoints(initial)
            }
            setReorderMode((v) => !v)
          }}
          className="text-sm rounded border px-3 py-1 hover:bg-gray-50"
        >
          {reorderMode ? 'Cancel' : 'Reorder'}
        </button>
        {reorderMode && (
          <button
            onClick={handleSave}
            disabled={saving}
            className="text-sm rounded border border-black bg-black text-white px-3 py-1 hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Order'}
          </button>
        )}
      </div>

      {reorderMode ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={checkpoints.map((cp) => cp.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {checkpoints.map((checkpoint) => (
                <SortableCheckpoint key={checkpoint.id} checkpoint={checkpoint} eventId={eventId} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        <div className="space-y-2">
          {checkpoints.map((checkpoint) => (
            <LinkCheckpoint key={checkpoint.id} checkpoint={checkpoint} eventId={eventId} />
          ))}
        </div>
      )}
    </div>
  )
}
