import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { APPLICATION_STATUSES, CONTRACT_TYPES } from '@/lib/constants'

const rowSchema = z.object({
  title: z.string().min(1).max(200),
  companyName: z.string().min(1).max(200),
  offerUrl: z.string().url().optional().nullable(),
  city: z.string().max(100).optional().nullable(),
  remote: z.boolean().optional(),
  contractType: z.enum(CONTRACT_TYPES).optional(),
  salary: z.string().max(100).optional().nullable(),
  status: z.enum(APPLICATION_STATUSES).optional(),
  notes: z.string().max(5000).optional().nullable(),
  tags: z.array(z.string().max(50)).optional(),
  appliedAt: z.string().datetime().optional().nullable(),
})

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  if (!Array.isArray(body) || body.length === 0) {
    return Response.json({ error: 'Expected non-empty array' }, { status: 400 })
  }

  if (body.length > 500) {
    return Response.json({ error: 'Max 500 rows per import' }, { status: 400 })
  }

  const valid = []
  const skipped = []

  for (let i = 0; i < body.length; i++) {
    const parsed = rowSchema.safeParse(body[i])
    if (parsed.success) {
      const d = parsed.data
      valid.push({
        userId: session.user.id,
        title: d.title,
        companyName: d.companyName,
        offerUrl: d.offerUrl || null,
        city: d.city || null,
        remote: d.remote ?? false,
        contractType: d.contractType ?? 'CDI',
        salary: d.salary || null,
        status: d.status ?? 'wishlist',
        notes: d.notes || null,
        tags: d.tags ?? [],
        appliedAt: d.appliedAt ? new Date(d.appliedAt) : null,
      })
    } else {
      skipped.push(i + 1)
    }
  }

  if (valid.length === 0) {
    return Response.json({ error: 'No valid rows', skipped }, { status: 422 })
  }

  await prisma.application.createMany({ data: valid, skipDuplicates: false })

  return Response.json({ imported: valid.length, skipped })
}
