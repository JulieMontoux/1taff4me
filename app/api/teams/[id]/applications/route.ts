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
    include: { members: { select: { userId: true } } },
  })
  if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isMember = team.ownerId === userId || team.members.some((m) => m.userId === userId)
  if (!isMember) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const sharedApps = await prisma.sharedApplication.findMany({
    where: { teamId: params.id },
    include: {
      application: true,
      sharedBy: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { sharedAt: 'desc' },
  })

  return NextResponse.json(sharedApps)
}
