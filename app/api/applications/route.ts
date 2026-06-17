import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createApplicationSchema } from '@/lib/validations'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const tag = searchParams.get('tag')

  try {
    const applications = await prisma.application.findMany({
      where: {
        userId: session.user.id,
        ...(status && { status }),
        ...(tag && { tags: { has: tag } }),
      },
      orderBy: { createdAt: 'desc' },
    })

    return Response.json(applications)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = createApplicationSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation error', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const data = result.data

  if (data.status === 'applied') {
    if (!data.appliedAt) {
      data.appliedAt = new Date().toISOString()
    }
    if (!data.reminderAt) {
      const settings = await prisma.userSettings.findUnique({
        where: { userId: session.user.id },
      })
      const days = settings?.reminderDays ?? 7
      data.reminderAt = new Date(
        new Date(data.appliedAt).getTime() + days * 86400000
      ).toISOString()
    }
  }

  try {
    const application = await prisma.application.create({
      data: {
        ...data,
        userId: session.user.id,
        appliedAt: data.appliedAt ? new Date(data.appliedAt) : null,
        reminderAt: data.reminderAt ? new Date(data.reminderAt) : null,
      },
    })

    return Response.json(application, { status: 201 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
