import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { randomBytes } from 'crypto'

const schema = z.object({
  reminderDays: z.number().int().min(1).max(90).optional(),
  emailReminders: z.boolean().optional(),
  favoriteDomains: z.array(z.string().max(100)).optional(),
  favoriteCities: z.array(z.string().max(100)).optional(),
})

function generateToken() {
  return randomBytes(32).toString('hex')
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, apiToken: generateToken() },
    update: {},
  })

  return Response.json(settings)
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, apiToken: generateToken(), ...parsed.data },
    update: parsed.data,
  })

  return Response.json(settings)
}

// POST /api/settings → regenerate API token
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const settings = await prisma.userSettings.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, apiToken: generateToken() },
    update: { apiToken: generateToken() },
  })

  return Response.json({ apiToken: settings.apiToken })
}
