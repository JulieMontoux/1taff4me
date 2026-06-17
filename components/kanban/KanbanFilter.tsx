'use client'

interface Props {
  tags: string[]
  activeTag: string | null
  onChange: (tag: string | null) => void
}

export function KanbanFilter({ tags, activeTag, onChange }: Props) {
  if (tags.length === 0) return null

  return (
    <div className="flex items-center gap-2 flex-wrap mb-3 pb-3 border-b border-gray-200">
      <span className="text-xs font-medium text-gray-400 flex-shrink-0">Filtrer :</span>

      {tags.map((tag) => (
        <button
          key={tag}
          onClick={() => onChange(activeTag === tag ? null : tag)}
          className={[
            'text-xs px-2.5 py-1 rounded-full font-medium transition-colors',
            activeTag === tag
              ? 'bg-violet-600 text-white'
              : 'bg-violet-50 text-violet-700 hover:bg-violet-100',
          ].join(' ')}
        >
          #{tag}
        </button>
      ))}

      {activeTag && (
        <button
          onClick={() => onChange(null)}
          className="text-xs text-gray-400 hover:text-gray-600 ml-1 underline"
        >
          Effacer
        </button>
      )}
    </div>
  )
}
