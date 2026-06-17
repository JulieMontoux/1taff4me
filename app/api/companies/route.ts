import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(200),
  website: z.string().url().optional().or(z.literal('')),
  domain: z.string().max(100).optional(),
  cities: z.array(z.string().max(100)).optional(),
  notes: z.string().max(2000).optional(),
  contactLinkedin: z.string().max(500).optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const companies = await prisma.wishlistCompany.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return Response.json(companies)
}

export async function POST(req: Request) {
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

  const { name, website, domain, cities, notes, contactLinkedin } = parsed.data

  const company = await prisma.wishlistCompany.create({
    data: {
      userId: session.user.id,
      name,
      website: website || null,
      domain: domain || null,
      cities: cities ?? [],
      notes: notes || null,
      contactLinkedin: contactLinkedin || null,
    },
  })

  return Response.json(company, { status: 201 })
}
