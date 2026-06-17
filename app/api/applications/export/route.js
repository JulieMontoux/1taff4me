import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Parser } from 'json2csv'
import { STATUS_LABELS } from '@/lib/constants'

const FIELDS = [
  { label: 'Titre du poste', value: 'title' },
  { label: 'Entreprise', value: 'companyName' },
  { label: 'Statut', value: (row) => STATUS_LABELS[row.status] ?? row.status },
  { label: 'Contrat', value: 'contractType' },
  { label: 'Ville', value: (row) => row.city ?? '' },
  { label: 'Remote', value: (row) => (row.remote ? 'Oui' : 'Non') },
  { label: 'Salaire', value: (row) => row.salary ?? '' },
  { label: 'URL offre', value: (row) => row.offerUrl ?? '' },
  { label: 'Tags', value: (row) => (row.tags ?? []).join(', ') },
  { label: 'Contact', value: (row) => row.contactName ?? '' },
  { label: 'Email contact', value: (row) => row.contactEmail ?? '' },
  { label: 'LinkedIn contact', value: (row) => row.contactLinkedin ?? '' },
  { label: 'Date de candidature', value: (row) => row.appliedAt ? new Date(row.appliedAt).toLocaleDateString('fr-FR') : '' },
  { label: 'Rappel', value: (row) => row.reminderAt ? new Date(row.reminderAt).toLocaleDateString('fr-FR') : '' },
  { label: 'Notes', value: (row) => row.notes ?? '' },
  { label: 'Créée le', value: (row) => new Date(row.createdAt).toLocaleDateString('fr-FR') },
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
