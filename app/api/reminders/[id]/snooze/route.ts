import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const app = await prisma.application.findUnique({ where: { id: params.id } })
  if (!app || app.userId !== session.user.id) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const settings = await prisma.userSettings.findUnique({
    where: { userId: session.user.id },
  })
  const days = settings?.reminderDays ?? 7

  try {
    const updated = await prisma.application.update({
      where: { id: params.id },
      data: { reminderAt: new Date(Date.now() + days * 86_400_000) },
    })

    return Response.json(updated)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
