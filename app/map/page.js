'use client'

import dynamic from 'next/dynamic'
import { useState, useEffect } from 'react'

const LeafletMap = dynamic(() => import('@/components/map/LeafletMap'), {
  ssr: false,
  loading: () => <div className="flex-1 bg-gray-100 rounded-xl animate-pulse" />,
})

export default function MapPage() {
  const [applications, setApplications] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all')

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

  const withCity = applications.filter((a) => a.city)
  const filtered =
    filter === 'all' ? withCity : withCity.filter((a) => a.status === filter)

  const noCity = applications.length > 0 && withCity.length < applications.length

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Carte</h1>
          {!loading && (
            <p className="text-xs text-gray-500 mt-0.5">
              {withCity.length} candidature{withCity.length !== 1 ? 's' : ''} géolocalisée{withCity.length !== 1 ? 's' : ''}
              {noCity && ` (${applications.length - withCity.length} sans ville)`}
            </p>
          )}
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          <option value="all">Tous les statuts</option>
          <option value="wishlist">Wishlist</option>
          <option value="to_apply">À postuler</option>
          <option value="applied">Postulées</option>
          <option value="hr_interview">Entretien RH</option>
          <option value="tech_interview">Entretien tech</option>
          <option value="offer">Offres</option>
          <option value="rejected">Refusées</option>
          <option value="abandoned">Abandonnées</option>
        </select>
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading ? (
        <div className="flex-1 bg-gray-100 rounded-xl animate-pulse" />
      ) : withCity.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-gray-400 text-sm bg-white rounded-xl border border-gray-200">
          Aucune candidature avec une ville renseignée
        </div>
      ) : (
        <div className="flex-1 min-h-0">
          <LeafletMap applications={filtered} />
        </div>
      )}
    </div>
  )
}
