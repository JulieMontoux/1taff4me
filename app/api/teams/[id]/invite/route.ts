import { getServerSession } from 'next-auth'
import { NextResponse } from 'next/server'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const inviteSchema = z.object({
  email: z.string().email().optional(),
})

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const team = await prisma.team.findUnique({ where: { id: params.id } })
  if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (team.ownerId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const parsed = inviteSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)

  const invite = await prisma.teamInvite.create({
    data: {
      teamId: params.id,
      email: parsed.data.email ?? '',
      expiresAt,
    },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  const joinUrl = `${baseUrl}/api/teams/invite/${invite.token}`

  if (parsed.data.email && process.env.RESEND_API_KEY) {
    try {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'noreply@1taff4me.fr',
          to: parsed.data.email,
          subject: `Invitation à rejoindre l'équipe « ${team.name} » sur 1taff4me`,
          html: `<p>${session.user.name ?? 'Quelqu\'un'} vous invite à rejoindre l\'équipe <strong>${team.name}</strong> sur 1taff4me.</p><p><a href="${joinUrl}">Rejoindre l\'équipe</a></p><p>Ce lien expire dans 7 jours.</p>`,
        }),
      })
    } catch {
      // Non-fatal: return join URL even if email fails
    }
  }

  return NextResponse.json({ token: invite.token, joinUrl, expiresAt })
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const team = await prisma.team.findUnique({ where: { id: params.id } })
  if (!team) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (team.ownerId !== session.user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const invites = await prisma.teamInvite.findMany({
    where: { teamId: params.id, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  })

  const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000'
  return NextResponse.json(
    invites.map((inv) => ({
      ...inv,
      joinUrl: `${baseUrl}/api/teams/invite/${inv.token}`,
    }))
  )
}
