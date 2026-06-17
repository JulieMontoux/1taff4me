import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
// @ts-expect-error — no types for json2csv
import { Parser } from 'json2csv'
import { STATUS_LABELS } from '@/lib/constants'

const FIELDS = [
  { label: 'Titre du poste', value: 'title' },
  { label: 'Entreprise', value: 'companyName' },
  { label: 'Statut', value: (row: import('@prisma/client').Application) => STATUS_LABELS[row.status as import('@/lib/constants').ApplicationStatus] ?? row.status },
  { label: 'Contrat', value: 'contractType' },
  { label: 'Ville', value: (row: import('@prisma/client').Application) => row.city ?? '' },
  { label: 'Remote', value: (row: import('@prisma/client').Application) => (row.remote ? 'Oui' : 'Non') },
  { label: 'Salaire', value: (row: import('@prisma/client').Application) => row.salary ?? '' },
  { label: 'URL offre', value: (row: import('@prisma/client').Application) => row.offerUrl ?? '' },
  { label: 'Tags', value: (row: import('@prisma/client').Application) => (row.tags ?? []).join(', ') },
  { label: 'Contact', value: (row: import('@prisma/client').Application) => row.contactName ?? '' },
  { label: 'Email contact', value: (row: import('@prisma/client').Application) => row.contactEmail ?? '' },
  { label: 'LinkedIn contact', value: (row: import('@prisma/client').Application) => row.contactLinkedin ?? '' },
  { label: 'Date de candidature', value: (row: import('@prisma/client').Application) => row.appliedAt ? new Date(row.appliedAt).toLocaleDateString('fr-FR') : '' },
  { label: 'Rappel', value: (row: import('@prisma/client').Application) => row.reminderAt ? new Date(row.reminderAt).toLocaleDateString('fr-FR') : '' },
  { label: 'Notes', value: (row: import('@prisma/client').Application) => row.notes ?? '' },
  { label: 'Créée le', value: (row: import('@prisma/client').Application) => new Date(row.createdAt).toLocaleDateString('fr-FR') },
]

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const applications = await prisma.application.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
  })

  try {
    const parser = new Parser({ fields: FIELDS, delimiter: ',', withBOM: true })
    const csv = parser.parse(applications)

    const filename = `candidatures-${new Date().toISOString().slice(0, 10)}.csv`

    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch {
    return Response.json({ error: 'Export failed' }, { status: 500 })
  }
}
