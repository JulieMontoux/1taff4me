'use client'

import { useState, useEffect } from 'react'

export function RemindersCount() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    function fetchCount() {
      fetch('/api/reminders/due')
        .then((r) => (r.ok ? r.json() : []))
        .then((data) => setCount(Array.isArray(data) ? data.length : 0))
        .catch(() => {})
    }

    fetchCount()
    const interval = setInterval(fetchCount, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (count === 0) return null

  return (
    <span className="ml-auto flex-shrink-0 min-w-[1.25rem] h-5 px-1 flex items-center justify-center text-xs font-bold bg-orange-500 text-white rounded-full">
      {count > 9 ? '9+' : count}
    </span>
  )
}
