import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { statusSchema } from '@/lib/validations'

export async function PATCH(request, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const existing = await prisma.application.findUnique({ where: { id: params.id } })
  if (!existing || existing.userId !== session.user.id) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const result = statusSchema.safeParse(body)
  if (!result.success) {
    return Response.json(
      { error: 'Validation error', details: result.error.flatten() },
      { status: 400 }
    )
  }

  const { status } = result.data
  const updateData = { status }

  if (status === 'applied' && !existing.appliedAt) {
    updateData.appliedAt = new Date()
    const settings = await prisma.userSettings.findUnique({
      where: { userId: session.user.id },
    })
    const days = settings?.reminderDays ?? 7
    updateData.reminderAt = new Date(Date.now() + days * 86400000)
  }

  try {
    const application = await prisma.application.update({
      where: { id: params.id },
      data: updateData,
    })

    return Response.json(application)
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
