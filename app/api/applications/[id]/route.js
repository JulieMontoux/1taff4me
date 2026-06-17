import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { updateApplicationSchema } from '@/lib/validations'

async function getOwnedApplication(id, userId) {
  const app = await prisma.application.findUnique({ where: { id } })
  if (!app || app.userId !== userId) return null
  return app
}

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await getOwnedApplication(params.id, session.user.id)
  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = updateApplicationSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation error', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const data = result.data

  if (data.status === 'applied' && !existing.appliedAt && !data.appliedAt) {
    data.appliedAt = new Date().toISOString()
  }

  if (data.status === 'applied' && !data.reminderAt && !existing.reminderAt) {
    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    })
    const days = settings?.reminderDays ?? 7
    const base = data.appliedAt ?? existing.appliedAt ?? new Date()
    data.reminderAt = new Date(
      new Date(base).getTime() + days * 86400000
    ).toISOString()
  }

  try {
    const application = await prisma.application.update({
      where: { id: params.id },
      data: {
        ...data,
        appliedAt:
          data.appliedAt !== undefined
            ? data.appliedAt
              ? new Date(data.appliedAt)
              : null
            : undefined,
        reminderAt:
          data.reminderAt !== undefined
            ? data.reminderAt
              ? new Date(data.reminderAt)
              : null
            : undefined,
      },
    })

    return Response.json(application)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await getOwnedApplication(params.id, session.user.id)
  if (!existing) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  try {
    await prisma.application.delete({ where: { id: params.id } })
    return new Response(null, { status: 204 })
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
