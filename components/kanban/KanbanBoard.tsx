'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from '@dnd-kit/core'
import { COLUMNS } from '@/lib/kanban'
import { KanbanColumn } from './KanbanColumn'
import { ApplicationCard } from './ApplicationCard'
import { KanbanFilter } from './KanbanFilter'
import type { Application } from '@/lib/types'

interface Props {
  refreshKey: number
  onCardClick: (app: Application) => void
  activeTag: string | null
  onActiveTagChange: (tag: string | null) => void
}

export function KanbanBoard({ onCardClick, refreshKey, activeTag, onActiveTagChange }: Props) {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeApp, setActiveApp] = useState<Application | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  const fetchApplications = useCallback(() => {
    setLoading(true)
    fetch('/api/applications')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((data) => {
        setApplications(Array.isArray(data) ? data : [])
        setError(null)
      })
      .catch(() => setError('Impossible de charger les candidatures.'))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchApplications()
  }, [fetchApplications, refreshKey])

  function handleDragStart({ active }: DragStartEvent) {
    const app = applications.find((a) => a.id === active.id)
    setActiveApp(app ?? null)
  }

  function handleDragEnd({ active, over }: DragEndEvent) {
    setActiveApp(null)
    if (!over) return

    const targetColumn = COLUMNS.find((c) => c.id === over.id)
    if (!targetColumn) return

    const app = applications.find((a) => a.id === active.id)
    if (!app) return

    const sourceColumn = COLUMNS.find((c) => c.statuses.includes(app.status))
    if (sourceColumn?.id === targetColumn.id) return

    const newStatus = targetColumn.id === 'rejected' ? 'rejected' : targetColumn.id

    // Optimistic update immediately
    setApplications((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, status: newStatus } : a))
    )

    fetch(`/api/applications/${app.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then((updated) => {
        // Sync server response (auto-set appliedAt/reminderAt from API)
        setApplications((prev) =>
          prev.map((a) => (a.id === updated.id ? updated : a))
        )
      })
      .catch(() => {
        // Revert on failure
        setApplications((prev) =>
          prev.map((a) => (a.id === app.id ? app : a))
        )
      })
  }

  function handleDragCancel() {
    setActiveApp(null)
  }

  const allTags = [...new Set(applications.flatMap((a) => a.tags ?? []))].sort()
  const displayed = activeTag
    ? applications.filter((a) => a.tags?.includes(activeTag))
    : applications

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = displayed.filter((a) => col.statuses.includes(a.status))
    return acc
  }, {} as Record<string, Application[]>)

  if (error) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="text-center">
          <p className="text-red-600 text-sm mb-3">{error}</p>
          <button
            onClick={fetchApplications}
            className="text-sm text-brand-600 hover:text-brand-700 underline"
          >
            Réessayer
          </button>
        </div>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <KanbanFilter
        tags={allTags}
        activeTag={activeTag}
        onChange={onActiveTagChange}
      />
      <div
        className="flex gap-3 overflow-x-auto pb-4"
        style={{ minHeight: 'calc(100vh - 11rem)' }}
      >
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col.id}
            column={col}
            applications={grouped[col.id] ?? []}
            loading={loading}
            onCardClick={onCardClick}
          />
        ))}
      </div>

      <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
        {activeApp ? (
          <ApplicationCard application={activeApp} isDragOverlay />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
