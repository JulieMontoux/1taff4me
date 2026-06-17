'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'
import Link from 'next/link'

const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => <div className="flex-1 bg-gray-100 rounded-xl animate-pulse" />,
})

const OVERLAY_KEY = '1taff4me_searchOverlay'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'to_apply', label: 'À postuler' },
  { value: 'applied', label: 'Postulées' },
  { value: 'hr_interview', label: 'Entretien RH' },
  { value: 'tech_interview', label: 'Entretien tech' },
  { value: 'offer', label: 'Offres' },
  { value: 'rejected', label: 'Refusées' },
  { value: 'abandoned', label: 'Abandonnées' },
]

export default function MapPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')
  const [searchOverlay, setSearchOverlay] = useState(null)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(OVERLAY_KEY)
      if (raw) setSearchOverlay(JSON.parse(raw))
    } catch {}
  }, [])

  useEffect(() => {
    fetch('/api/applications')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(setApplications)
      .catch(() => setError('Impossible de charger les candidatures.'))
      .finally(() => setLoading(false))
  }, [])

  function clearOverlay() {
    localStorage.removeItem(OVERLAY_KEY)
    setSearchOverlay(null)
  }

  const withCity = applications.filter((a) => a.city)
  const filtered = filter === 'all' ? withCity : withCity.filter((a) => a.status === filter)
  const noCity = applications.length > 0 && withCity.length < applications.length
  const hasCompanies = searchOverlay?.companies?.length > 0

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Carte</h1>
          {!loading && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {withCity.length} candidature{withCity.length !== 1 ? 's' : ''} géolocalisée{withCity.length !== 1 ? 's' : ''}
              {noCity && ` · ${applications.length - withCity.length} sans ville`}
            </p>
          )}
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>

      {/* Search overlay banner */}
      {searchOverlay && (
        <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-xl px-4 py-2.5 text-sm flex-shrink-0">
          <span className="text-purple-700 font-medium flex-1">
            🗺️ Overlay recherche :{' '}
            <span className="font-semibold">{searchOverlay.label ?? searchOverlay.city}</span>
            {searchOverlay.domain && ` · ${searchOverlay.domain}`}
            {hasCompanies && ` · ${searchOverlay.companies.length} entreprise${searchOverlay.companies.length !== 1 ? 's' : ''}`}
            {!hasCompanies && ' · Zoom sur la zone'}
          </span>
          <Link
            href="/search"
            className="text-purple-600 hover:text-purple-800 text-xs font-medium underline underline-offset-2"
          >
            Modifier
          </Link>
          <button
            onClick={clearOverlay}
            className="text-purple-400 hover:text-purple-700 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading ? (
        <div className="flex-1 bg-gray-100 rounded-xl animate-pulse" />
      ) : withCity.length === 0 && !searchOverlay ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800">
          Aucune candidature avec une ville renseignée
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <LeafletMap applications={filtered} searchOverlay={searchOverlay} />
        </div>
      )}
    </div>
  )
}
