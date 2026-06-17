'use client'

import { formatDate, isReminderDue } from '@/lib/kanban'

export function ApplicationCard({ application, onClick }) {
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
      onClick={onClick}
      className="bg-white rounded-lg border border-gray-200 p-3 shadow-sm hover:shadow-md hover:border-gray-300 transition-all cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <h4 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2 flex-1">
          {title}
        </h4>
        {reminderDue && (
          <span
            title="À relancer"
            className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-400 mt-1 animate-pulse"
          />
        )}
      </div>

      <p className="text-xs text-gray-500 mb-2 truncate">{companyName}</p>

      <div className="flex flex-wrap gap-1 mb-2">
        {remote ? (
          <span className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 rounded-md">
            Remote
          </span>
        ) : city ? (
          <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-md">
            {city}
          </span>
        ) : null}
        <span className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded-md">
          {contractType}
        </span>
      </div>

      {tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-1.5 py-0.5 bg-violet-50 text-violet-700 rounded-md"
            >
              #{tag}
            </span>
          ))}
          {tags.length > 3 && (
            <span className="text-xs text-gray-400">+{tags.length - 3}</span>
          )}
        </div>
      )}

      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-gray-400">
          {appliedAt ? formatDate(appliedAt) : ''}
        </span>
        {offerUrl && (
          <a
            href={offerUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-xs text-brand-600 hover:text-brand-700 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            Voir offre →
          </a>
        )}
      </div>
    </div>
  )
}
