import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(1).max(200).optional(),
  website: z.string().url().optional().or(z.literal('')),
  domain: z.string().max(100).optional(),
  cities: z.array(z.string().max(100)).optional(),
  notes: z.string().max(2000).optional(),
  contactLinkedin: z.string().max(500).optional(),
})

async function getOwned(id, userId) {
  const company = await prisma.wishlistCompany.findUnique({ where: { id } })
  if (!company || company.userId !== userId) return null
  return company
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const company = await getOwned(params.id, session.user.id)
  if (!company) return Response.json({ error: 'Not found' }, { status: 404 })

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

  const data = {}
  const d = parsed.data
  if (d.name !== undefined) data.name = d.name
  if (d.website !== undefined) data.website = d.website || null
  if (d.domain !== undefined) data.domain = d.domain || null
  if (d.cities !== undefined) data.cities = d.cities
  if (d.notes !== undefined) data.notes = d.notes || null
  if (d.contactLinkedin !== undefined) data.contactLinkedin = d.contactLinkedin || null

  const updated = await prisma.wishlistCompany.update({ where: { id: params.id }, data })
  return Response.json(updated)
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const company = await getOwned(params.id, session.user.id)
  if (!company) return Response.json({ error: 'Not found' }, { status: 404 })

  await prisma.wishlistCompany.delete({ where: { id: params.id } })
  return new Response(null, { status: 204 })
}
