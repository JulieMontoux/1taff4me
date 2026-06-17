'use client'

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
  AreaChart,
  Area,
} from 'recharts'

interface StatusBarChartProps {
  data: Array<{ status: string; label: string; count: number }>
  hasApps: boolean
}

interface ContractPieChartProps {
  data: Array<{ contractType: string; count: number }>
  hasApps: boolean
}

interface TimelineAreaChartProps {
  data: Array<{ label: string; count: number }>
  hasApps: boolean
}

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

function EmptyState() {
  return (
    <div className="flex items-center justify-center h-40 text-gray-400 text-sm">
      Pas encore de données
    </div>
  )
}

export function StatusBarChart({ data, hasApps }: StatusBarChartProps) {
  if (!hasApps) return <EmptyState />
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} barSize={28}>
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
          {data.map((entry) => (
            <Cell key={entry.status} fill={STATUS_COLORS[entry.status as keyof typeof STATUS_COLORS]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

export function ContractPieChart({ data, hasApps }: ContractPieChartProps) {
  if (!hasApps || data.length === 0) return <EmptyState />
  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="contractType"
          cx="50%"
          cy="45%"
          outerRadius={70}
          innerRadius={32}
          paddingAngle={3}
          label={(props: { contractType?: string; percent?: number }) =>
            (props.percent ?? 0) > 0.07 ? `${props.contractType} ${Math.round((props.percent ?? 0) * 100)}%` : ''
          }
          labelLine={false}
        >
          {data.map((_, i) => (
            <Cell key={i} fill={CONTRACT_COLORS[i % CONTRACT_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: 12 }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function TimelineAreaChart({ data, hasApps }: TimelineAreaChartProps) {
  if (!hasApps) return <EmptyState />
  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data}>
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
  )
}
