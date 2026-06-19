import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'

export async function authenticate(request: Request): Promise<{ id: string } | null> {
  const authHeader = request.headers.get('Authorization')
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7)
    const settings = await prisma.userSettings.findUnique({
      where: { apiToken: token },
    })
    if (settings) return { id: settings.userId }
  }

  const session = await getServerSession(authOptions)
  if (session?.user?.id) return { id: session.user.id }

  return null
}
