import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request, { params }: { params: { token: string } }) {
  const session = await getServerSession(authOptions)

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'

  if (!session?.user?.id) {
    const callbackUrl = encodeURIComponent(`/api/teams/invite/${params.token}`)
    return NextResponse.redirect(`${baseUrl}/auth/signin?callbackUrl=${callbackUrl}`)
  }

  const invite = await prisma.teamInvite.findUnique({ where: { token: params.token } })

  if (!invite || invite.expiresAt < new Date()) {
    return NextResponse.redirect(`${baseUrl}/teams?error=invite_expired`)
  }

  const userId = session.user.id

  const existing = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: invite.teamId, userId } },
  })

  const team = await prisma.team.findUnique({ where: { id: invite.teamId } })
  if (team?.ownerId === userId || existing) {
    return NextResponse.redirect(`${baseUrl}/teams?already=1`)
  }

  await prisma.teamMember.create({
    data: { teamId: invite.teamId, userId },
  })

  await prisma.teamInvite.delete({ where: { token: params.token } })

  return NextResponse.redirect(`${baseUrl}/teams?joined=${invite.teamId}`)
}
