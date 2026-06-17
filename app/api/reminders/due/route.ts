import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const due = await prisma.application.findMany({
      where: {
        userId: session.user.id,
        reminderAt: { lte: new Date() },
        status: { in: ['applied', 'hr_interview', 'tech_interview'] },
      },
      orderBy: { reminderAt: 'asc' },
    })

    return Response.json(due)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
