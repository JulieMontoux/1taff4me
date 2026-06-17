'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'

const ChartSkeleton = ({ height = 220 }) => (
  <div className={`bg-gray-100 rounded-lg animate-pulse`} style={{ height }} />
)

const StatusBarChart = dynamic(
  () => import('@/components/stats/StatsCharts').then((m) => m.StatusBarChart),
  { loading: () => <ChartSkeleton />, ssr: false }
)
const ContractPieChart = dynamic(
  () => import('@/components/stats/StatsCharts').then((m) => m.ContractPieChart),
  { loading: () => <ChartSkeleton />, ssr: false }
)
const TimelineAreaChart = dynamic(
  () => import('@/components/stats/StatsCharts').then((m) => m.TimelineAreaChart),
  { loading: () => <ChartSkeleton height={180} />, ssr: false }
)

function KpiCard({ label, value, sub, color = 'gray' }) {
  const colors = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    orange: 'bg-orange-50 border-orange-200 text-orange-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    gray: 'bg-gray-50 border-gray-200 text-gray-700',
  }
  return (
    <div className={`rounded-xl border p-4 ${colors[color]}`}>
      <p className="text-xs font-medium opacity-70 mb-1">{label}</p>
      <p className="text-3xl font-black">{value ?? '–'}</p>
      {sub && <p className="text-xs opacity-60 mt-1">{sub}</p>}
    </div>
  )
}

export default function StatsPage() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/stats')
      .then((r) => {
        if (!r.ok) throw new Error()
        return r.json()
      })
      .then(setStats)
      .catch(() => setError('Impossible de charger les statistiques.'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-7 bg-gray-200 rounded w-32 mb-6" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 h-64 bg-gray-100 rounded-xl" />
          <div className="h-64 bg-gray-100 rounded-xl" />
        </div>
        <div className="h-56 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  if (error) {
    return <p className="text-red-600 text-sm">{error}</p>
  }

  const { kpis, byStatus, byContractType, byCity, timeline } = stats
  const hasApps = kpis.total > 0

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">Statistiques</h1>

      {/* KPIs — paint immediately, no recharts dependency */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Candidatures" value={kpis.total} color="gray" />
        <KpiCard label="En cours" value={kpis.inProgress} color="blue" />
        <KpiCard
          label="Taux de réponse"
          value={kpis.responseRate !== null ? `${kpis.responseRate}%` : '–'}
          sub="parmi les postulées"
          color="orange"
        />
        <KpiCard label="Offres reçues" value={kpis.offers} color="green" />
      </div>

      {/* Charts — lazily loaded, recharts JS deferred */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Par statut</p>
          <StatusBarChart data={byStatus} hasApps={hasApps} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Par contrat</p>
          <ContractPieChart data={byContractType} hasApps={hasApps} />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">Candidatures par mois</p>
        <TimelineAreaChart data={timeline} hasApps={hasApps} />
      </div>

      {byCity.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-3">Top villes</p>
          <div className="space-y-2">
            {byCity.map(({ city, count }) => (
              <div key={city} className="flex items-center gap-3">
                <span className="text-sm text-gray-700 w-28 truncate">{city}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 bg-brand-500 rounded-full transition-all"
                    style={{ width: `${Math.round((count / byCity[0].count) * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
