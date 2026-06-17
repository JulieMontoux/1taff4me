import { ApplicationCard } from './ApplicationCard'
import { CardSkeleton } from './CardSkeleton'

export function KanbanColumn({ column, applications, loading, onCardClick }) {
  return (
    <div
      className={`flex-shrink-0 w-64 flex flex-col rounded-xl border ${column.border} ${column.bg}`}
    >
      <div className={`flex items-center justify-between px-3 py-2.5 border-b ${column.border}`}>
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

      <div className="flex-1 p-2 space-y-2 overflow-y-auto min-h-24">
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
