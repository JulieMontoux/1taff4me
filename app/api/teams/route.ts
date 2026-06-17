import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const createTeamSchema = z.object({
  name: z.string().min(1).max(100).trim(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  const [ownedTeams, memberTeams] = await Promise.all([
    prisma.team.findMany({
      where: { ownerId: userId },
      include: {
        _count: { select: { members: true, sharedApps: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.teamMember.findMany({
      where: { userId },
      include: {
        team: {
          include: {
            owner: { select: { id: true, name: true, email: true, image: true } },
            _count: { select: { members: true, sharedApps: true } },
          },
        },
      },
      orderBy: { joinedAt: 'desc' },
    }),
  ])

  return NextResponse.json({ ownedTeams, memberTeams })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = createTeamSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const team = await prisma.team.create({
    data: { name: parsed.data.name, ownerId: session.user.id },
    include: { _count: { select: { members: true, sharedApps: true } } },
  })

  return NextResponse.json(team, { status: 201 })
}
