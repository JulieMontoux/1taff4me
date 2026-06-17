import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const shareSchema = z.object({ teamId: z.string() })

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const app = await prisma.application.findUnique({ where: { id: params.id } })
  if (!app || app.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const shares = await prisma.sharedApplication.findMany({
    where: { applicationId: params.id },
    include: { team: { select: { id: true, name: true } } },
  })

  return NextResponse.json(shares.map((s) => s.team))
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const userId = session.user.id

  const app = await prisma.application.findUnique({ where: { id: params.id } })
  if (!app || app.userId !== userId) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const body = await req.json()
  const parsed = shareSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const { teamId } = parsed.data

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: { members: { select: { userId: true } } },
  })
  if (!team) return NextResponse.json({ error: 'Team not found' }, { status: 404 })

  const isMember = team.ownerId === userId || team.members.some((m) => m.userId === userId)
  if (!isMember) return NextResponse.json({ error: 'Not a team member' }, { status: 403 })

  const share = await prisma.sharedApplication.upsert({
    where: { applicationId_teamId: { applicationId: params.id, teamId } },
    create: { applicationId: params.id, teamId, sharedById: userId },
    update: {},
  })

  return NextResponse.json(share, { status: 201 })
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const app = await prisma.application.findUnique({ where: { id: params.id } })
  if (!app || app.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await req.json()
  const parsed = shareSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  await prisma.sharedApplication.deleteMany({
    where: { applicationId: params.id, teamId: parsed.data.teamId },
  })

  return new NextResponse(null, { status: 204 })
}
