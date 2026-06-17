'use client'

import { useState } from 'react'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-900">Mes candidatures</h1>
        <button
          onClick={() => {}}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          + Nouvelle candidature
        </button>
      </div>

      <KanbanBoard
        refreshKey={refreshKey}
        onCardClick={(app) => {
          // drawer opens in #6
          console.log('open', app.id)
        }}
      />
    </div>
  )
}
