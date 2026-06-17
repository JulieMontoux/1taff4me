'use client'

import { useDraggable } from '@dnd-kit/core'
import { formatDate, isReminderDue } from '@/lib/kanban'

export function ApplicationCard({ application, onClick, isDragOverlay = false }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: application.id,
    disabled: isDragOverlay,
  })

  const {
    title,
    companyName,
    city,
    remote,
    contractType,
    tags,
    appliedAt,
    reminderAt,
    offerUrl,
  } = application

  const reminderDue = isReminderDue(reminderAt)

  return (
    <div
      ref={isDragOverlay ? undefined : setNodeRef}
      {...(isDragOverlay ? {} : attributes)}
      {...(isDragOverlay ? {} : listeners)}
      onClick={onClick}
      className={[
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-sm select-none group',
        isDragOverlay
          ? 'rotate-1 shadow-xl cursor-grabbing'
          : 'cursor-grab active:cursor-grabbing hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600 transition-all',
        isDragging ? 'opacity-30' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 leading-tight line-clamp-2 flex-1">
          {title}
        </h4>
        {reminderDue && !isDragOverlay && (
          <span
            title="À relancer"
            className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-400 mt-1 animate-pulse"
          />
        )}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 truncate">{companyName}</p>

      <div className="flex flex-wrap gap-1 mb-2">
        {remote ? (
          <span className="text-xs px-1.5 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-md">
            Remote
          </span>
        ) : city ? (
          <span className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-md">
            {city}
          </span>
        ) : null}
        <span className="text-xs px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded-md">
          {contractType}
        </span>
      </div>

      {tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-1.5 py-0.5 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-md"
            >
              #{tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-xs text-gray-400 dark:text-gray-500">+{tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-400 dark:text-gray-500">
          {appliedAt ? formatDate(appliedAt) : ''}
        </span>
        {offerUrl && !isDragOverlay && (
          <a
            href={offerUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-brand-600 dark:text-brand-400 hover:text-brand-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Voir offre →
          </a>
        )}
      </div>
    </div>
  )
}
