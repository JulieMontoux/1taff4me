'use client'

import { useState } from 'react'
import { KanbanBoard } from '@/components/kanban/KanbanBoard'
import { ApplicationDrawer } from '@/components/kanban/ApplicationDrawer'
import { RemindersBar } from '@/components/kanban/RemindersBar'
import { ImportModal } from '@/components/kanban/ImportModal'

export default function DashboardPage() {
  const [refreshKey, setRefreshKey] = useState(0)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [editingApp, setEditingApp] = useState(null)
  const [activeTag, setActiveTag] = useState(null)
  const [importOpen, setImportOpen] = useState(false)

  function openCreate() {
    setEditingApp(null)
    setDrawerOpen(true)
  }

  function openEdit(app) {
    setEditingApp(app)
    setDrawerOpen(true)
  }

  function handleClose() {
    setDrawerOpen(false)
    setEditingApp(null)
  }

  function handleSaved() {
    setRefreshKey((k) => k + 1)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Mes candidatures</h1>
        <div className="flex items-center gap-2">
          <a
            href="/api/applications/export"
            download
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title="Exporter en CSV"
          >
            ↓ CSV
          </a>
          <button
            onClick={() => setImportOpen(true)}
            className="px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            title="Importer un CSV"
          >
            ↑ Import
          </button>
          <button
            onClick={openCreate}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors"
          >
            + Nouvelle candidature
          </button>
        </div>
      </div>

      <RemindersBar onOpenApp={openEdit} refreshKey={refreshKey} />

      <KanbanBoard
        refreshKey={refreshKey}
        onCardClick={openEdit}
        activeTag={activeTag}
        onActiveTagChange={setActiveTag}
      />

      <ApplicationDrawer
        open={drawerOpen}
        onClose={handleClose}
        application={editingApp}
        onSaved={handleSaved}
      />

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={handleSaved}
      />
    </div>
  )
}
