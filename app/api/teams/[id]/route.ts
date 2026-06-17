import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id
  const team = await prisma.team.findUnique({
    where: { id: params.id },
    include: {
      owner: { select: { id: true, name: true, email: true, image: true } },
      members: {
        include: { user: { select: { id: true, name: true, email: true, image: true } } },
        orderBy: { joinedAt: 'asc' },
      },
      _count: { select: { sharedApps: true } },
    },
  })

  if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isMember = team.ownerId === userId || team.members.some((m) => m.userId === userId)
  if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  return NextResponse.json(team)
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const team = await prisma.team.findUnique({ where: { id: params.id } })
  if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (team.ownerId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  await prisma.team.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
