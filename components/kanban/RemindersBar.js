'use client'

import { useState, useEffect, useCallback } from 'react'
import { formatDate } from '@/lib/kanban'

export function RemindersBar({ onOpenApp, refreshKey }) {
  const [reminders, setReminders] = useState([])
  const [collapsed, setCollapsed] = useState(false)
  const [snoozingId, setSnoozingId] = useState(null)

  const fetchReminders = useCallback(() => {
    fetch('/api/reminders/due')
      .then((r) => r.json())
      .then((data) => setReminders(Array.isArray(data) ? data : []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchReminders()
  }, [fetchReminders, refreshKey])

  async function handleSnooze(id) {
    setSnoozingId(id)
    try {
      const res = await fetch(`/api/reminders/${id}/snooze`, { method: 'POST' })
      if (res.ok) {
        setReminders((prev) => prev.filter((r) => r.id !== id))
      }
    } catch {
      // silent
    } finally {
      setSnoozingId(null)
    }
  }

  if (reminders.length === 0) return null

  return (
    <div className="mb-3 bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl overflow-hidden flex-shrink-0">
      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-orange-100 dark:hover:bg-orange-900/20 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse flex-shrink-0" />
          <span className="text-sm font-semibold text-orange-800 dark:text-orange-300">
            {reminders.length} relance{reminders.length > 1 ? 's' : ''} en attente
          </span>
        </div>
        <span className="text-orange-500 dark:text-orange-400 text-xs select-none">{collapsed ? '▼' : '▲'}</span>
      </button>

      {!collapsed && (
        <div className="px-3 pb-3 space-y-2">
          {reminders.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-lg px-3 py-2 border border-orange-100 dark:border-orange-800/50"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{r.companyName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{r.title}</p>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                {r.appliedAt && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 hidden sm:inline">
                    postulé {formatDate(r.appliedAt)}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => onOpenApp?.(r)}
                  className="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 underline"
                >
                  Voir
                </button>
                <button
                  type="button"
                  onClick={() => handleSnooze(r.id)}
                  disabled={snoozingId === r.id}
                  className="text-xs px-2.5 py-1 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 transition-colors whitespace-nowrap"
                >
                  {snoozingId === r.id ? '…' : 'Relancé ✓'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
