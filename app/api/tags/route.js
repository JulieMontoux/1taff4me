import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const rows = await prisma.application.findMany({
      where: { userId: session.user.id },
      select: { tags: true },
    })

    const tags = [...new Set(rows.flatMap((r) => r.tags))].sort()
    return Response.json(tags)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
