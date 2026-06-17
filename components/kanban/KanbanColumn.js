'use client'

import { useDroppable } from '@dnd-kit/core'
import { ApplicationCard } from './ApplicationCard'
import { CardSkeleton } from './CardSkeleton'

export function KanbanColumn({ column, applications, loading, onCardClick }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div
      className={[
        'flex-shrink-0 w-64 flex flex-col rounded-xl border transition-colors',
        isOver ? 'border-brand-400' : column.border,
        column.bg,
      ].join(' ')}
    >
      <div
        className={[
          'flex items-center justify-between px-3 py-2.5 border-b transition-colors',
          isOver ? 'border-brand-400' : column.border,
        ].join(' ')}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${column.dot}`} />
          <h3 className={`text-sm font-semibold ${column.text}`}>{column.label}</h3>
        </div>
        {!loading && (
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${column.badge}`}>
            {applications.length}
          </span>
        )}
      </div>

      <div
        ref={setNodeRef}
        className={[
          'flex-1 p-2 space-y-2 overflow-y-auto min-h-24 rounded-b-xl transition-colors',
          isOver ? 'bg-brand-50/40' : '',
        ].join(' ')}
      >
        {loading ? (
          <>
            <CardSkeleton />
            <CardSkeleton />
          </>
        ) : applications.length === 0 ? (
          <p className="text-xs text-center text-gray-400 pt-8 select-none">Vide</p>
        ) : (
          applications.map((app) => (
            <ApplicationCard
              key={app.id}
              application={app}
              onClick={() => onCardClick?.(app)}
            />
          ))
        )}
      </div>
    </div>
  )
}
