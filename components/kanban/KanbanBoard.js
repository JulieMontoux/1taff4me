'use client'

import { useState, useEffect, useCallback } from 'react'
import { COLUMNS } from '@/lib/kanban'
import { KanbanColumn } from './KanbanColumn'

export function KanbanBoard({ onCardClick, onAddClick, refreshKey }) {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchApplications = useCallback(() => {
    setLoading(true)
    fetch('/api/applications')
      .then((r) => {
        if (!r.ok) throw new Error('Fetch failed')
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

  const grouped = COLUMNS.reduce((acc, col) => {
    acc[col.id] = applications.filter((a) => col.statuses.includes(a.status))
    return acc
  }, {})

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
    <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 'calc(100vh - 11rem)' }}>
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
  )
}
