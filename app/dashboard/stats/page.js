'use client'

import { useState, useEffect } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
  Legend,
  AreaChart,
  Area,
} from 'recharts'

const STATUS_COLORS = {
  wishlist: '#9ca3af',
  to_apply: '#38bdf8',
  applied: '#fbbf24',
  hr_interview: '#fb923c',
  tech_interview: '#a78bfa',
  offer: '#34d399',
  rejected: '#f87171',
  abandoned: '#fca5a5',
}

const CONTRACT_COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626']

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

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
      Pas encore de données
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

      {/* KPIs */}
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

      {/* Bar + Pie */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Par statut</p>
          {!hasApps ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={byStatus} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#9ca3af' }}
                  tickLine={false}
                  axisLine={false}
                  width={24}
                />
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
                  cursor={{ fill: '#f9fafb' }}
                />
                <Bar dataKey="count" name="Candidatures" radius={[4, 4, 0, 0]}>
                  {byStatus.map((entry) => (
                    <Cell key={entry.status} fill={STATUS_COLORS[entry.status]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <p className="text-sm font-semibold text-gray-700 mb-4">Par contrat</p>
          {!hasApps || byContractType.length === 0 ? (
            <EmptyState />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie
                  data={byContractType}
                  dataKey="count"
                  nameKey="contractType"
                  cx="50%"
                  cy="45%"
                  outerRadius={70}
                  innerRadius={32}
                  paddingAngle={3}
                  label={({ contractType, percent }) =>
                    percent > 0.07 ? `${contractType} ${Math.round(percent * 100)}%` : ''
                  }
                  labelLine={false}
                >
                  {byContractType.map((_, i) => (
                    <Cell key={i} fill={CONTRACT_COLORS[i % CONTRACT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-700 mb-4">Candidatures par mois</p>
        {!hasApps ? (
          <EmptyState />
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={timeline}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#2563eb" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fontSize: 11, fill: '#9ca3af' }}
                tickLine={false}
                axisLine={false}
                width={24}
              />
              <Tooltip
                contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
              />
              <Area
                type="monotone"
                dataKey="count"
                name="Candidatures"
                stroke="#2563eb"
                strokeWidth={2}
                fill="url(#areaGrad)"
                dot={{ r: 3, fill: '#2563eb', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Top villes */}
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
