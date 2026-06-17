import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { APPLICATION_STATUSES, STATUS_LABELS } from '@/lib/constants'

const MONTH_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc']

function getLast12Months() {
  const now = new Date()
  return Array.from({ length: 12 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1)
    return d.toISOString().slice(0, 7)
  })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const userId = session.user.id

  try {
    const [byStatusRaw, byContractTypeRaw, byCityRaw, timelineApps] = await Promise.all([
      prisma.application.groupBy({
        by: ['status'],
        where: { userId },
        _count: { _all: true },
      }),
      prisma.application.groupBy({
        by: ['contractType'],
        where: { userId },
        _count: { _all: true },
        orderBy: { _count: { contractType: 'desc' } },
      }),
      prisma.application.groupBy({
        by: ['city'],
        where: { userId, city: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { city: 'desc' } },
        take: 6,
      }),
      prisma.application.findMany({
        where: { userId, appliedAt: { not: null } },
        select: { appliedAt: true },
      }),
    ])

    // All statuses represented (fill zeros)
    const statusMap = Object.fromEntries(byStatusRaw.map((r) => [r.status, r._count._all]))
    const byStatus = APPLICATION_STATUSES.map((s) => ({
      status: s,
      label: STATUS_LABELS[s],
      count: statusMap[s] ?? 0,
    }))

    // KPIs
    const total = byStatus.reduce((s, r) => s + r.count, 0)
    const inProgress =
      (statusMap.applied ?? 0) +
      (statusMap.hr_interview ?? 0) +
      (statusMap.tech_interview ?? 0)
    const offers = statusMap.offer ?? 0
    const totalApplied = total - (statusMap.wishlist ?? 0) - (statusMap.to_apply ?? 0)
    const responded =
      (statusMap.hr_interview ?? 0) +
      (statusMap.tech_interview ?? 0) +
      (statusMap.offer ?? 0) +
      (statusMap.rejected ?? 0) +
      (statusMap.abandoned ?? 0)
    const responseRate = totalApplied > 0 ? Math.round((responded / totalApplied) * 100) : null

    // Timeline (last 12 months, by appliedAt)
    const monthCounts = {}
    for (const { appliedAt } of timelineApps) {
      const key = appliedAt.toISOString().slice(0, 7)
      monthCounts[key] = (monthCounts[key] ?? 0) + 1
    }
    const last12 = getLast12Months()
    const timeline = last12.map((key) => {
      const [year, month] = key.split('-')
      return {
        key,
        label: `${MONTH_FR[parseInt(month) - 1]} ${year.slice(2)}`,
        count: monthCounts[key] ?? 0,
      }
    })

    return Response.json({
      kpis: { total, inProgress, responseRate, offers },
      byStatus,
      byContractType: byContractTypeRaw.map((r) => ({
        contractType: r.contractType,
        count: r._count._all,
      })),
      byCity: byCityRaw
        .filter((r) => r.city)
        .map((r) => ({ city: r.city, count: r._count._all })),
      timeline,
    })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
