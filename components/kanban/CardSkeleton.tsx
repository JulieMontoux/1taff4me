export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-3 animate-pulse">
      <div className="h-3.5 bg-gray-200 rounded w-3/4 mb-1.5" />
      <div className="h-3.5 bg-gray-200 rounded w-1/2 mb-3" />
      <div className="h-3 bg-gray-100 rounded w-2/5 mb-3" />
      <div className="flex gap-1">
        <div className="h-4 bg-gray-100 rounded w-10" />
        <div className="h-4 bg-gray-100 rounded w-8" />
      </div>
    </div>
  )
}
