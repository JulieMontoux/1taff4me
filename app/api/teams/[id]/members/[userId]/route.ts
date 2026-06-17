import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string; userId: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const team = await prisma.team.findUnique({ where: { id: params.id } })
  if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const isOwner = team.ownerId === session.user.id
  const isSelf = params.userId === session.user.id

  // Owner can remove anyone; members can only remove themselves (leave)
  if (!isOwner && !isSelf) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // Owner cannot be removed via this route (delete team instead)
  if (params.userId === team.ownerId) {
    return NextResponse.json({ error: 'Cannot remove team owner' }, { status: 400 })
  }

  await prisma.teamMember.delete({
    where: { teamId_userId: { teamId: params.id, userId: params.userId } },
  })

  return new NextResponse(null, { status: 204 })
}
