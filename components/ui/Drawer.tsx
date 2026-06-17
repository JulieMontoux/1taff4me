'use client'

import { useEffect } from 'react'

interface Props {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
}

export function Drawer({ open, onClose, title, children }: Props) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={[
          'fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-200',
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
      />

      {/* Panel */}
      <div
        className={[
          'fixed right-0 top-0 h-full w-full max-w-lg bg-white dark:bg-gray-900 z-50 shadow-2xl flex flex-col',
          'transition-transform duration-200 ease-out',
          open ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {open && children}
        </div>
      </div>
    </>
  )
}
