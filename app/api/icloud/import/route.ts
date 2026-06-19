import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { ImapFlow } from 'imapflow'
import Anthropic from '@anthropic-ai/sdk'

const PLATFORMS = ['apec.fr', 'indeed', 'welcometothejungle', 'linkedin', 'hellowork']

const IMAP_HOST = 'imap.mail.me.com'
const IMAP_PORT = 993

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { email: string; password: string }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { email, password } = body
  if (!email || !password) {
    return Response.json({ error: 'email and password required' }, { status: 400 })
  }

  const client = new ImapFlow({
    host: IMAP_HOST,
    port: IMAP_PORT,
    secure: true,
    auth: { user: email, pass: password },
    logger: false,
  })

  try {
    await client.connect()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json(
      { error: `Connexion IMAP échouée : ${msg}. Vérifie ton email et App-Specific Password (appleid.apple.com → Sécurité → Mots de passe spécifiques).` },
      { status: 401 }
    )
  }

  const emails: { from: string; subject: string; date: string; body: string }[] = []

  try {
    await client.mailboxOpen('INBOX')

    // Search emails from last 90 days — filter by platform client-side
    const since = new Date()
    since.setDate(since.getDate() - 90)

    const uids = await client.search({ since })
    const uidList = Array.isArray(uids) ? uids : []
    const slice = uidList.slice(-200) // last 200, filter below

    if (slice.length > 0) {
      for await (const msg of client.fetch(
        slice.join(','),
        { envelope: true, bodyParts: ['1'] }
      )) {
        if (!msg.envelope) continue

        const from = msg.envelope.from?.[0]?.address ?? ''
        const subject = msg.envelope.subject ?? ''
        const date = msg.envelope.date?.toISOString() ?? ''

        // Filter: must be from a job platform
        const lowerFrom = from.toLowerCase()
        if (!PLATFORMS.some((p) => lowerFrom.includes(p))) continue

        // Filter: subject must hint at application confirmation
        const lowerSubject = subject.toLowerCase()
        const isConfirmation =
          lowerSubject.includes('candidature') ||
          lowerSubject.includes('postuler') ||
          lowerSubject.includes('postulation') ||
          lowerSubject.includes('application') ||
          lowerSubject.includes('applied')

        if (!isConfirmation) continue

        let body = ''
        const part = msg.bodyParts?.get('1')
        if (part) {
          body = part.toString().slice(0, 2000)
        }

        emails.push({ from, subject, date, body })

        if (emails.length >= 60) break
      }
    }
  } finally {
    await client.logout()
  }

  if (emails.length === 0) {
    return Response.json({ applications: [], total: 0 })
  }

  const ai = new Anthropic()

  const emailsText = emails
    .map((e, i) =>
      `Email ${i + 1}:\nFrom: ${e.from}\nSubject: ${e.subject}\nDate: ${e.date}\nBody: ${e.body}`
    )
    .join('\n\n---\n\n')

  const response = await ai.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4096,
    system: `Tu es un assistant qui extrait des informations de candidatures d'emploi depuis des emails.
Pour chaque email qui est une confirmation de candidature envoyée, extrais:
- title: intitulé du poste (string)
- companyName: nom de l'entreprise (string)
- platform: APEC, Indeed, LinkedIn, Welcome to the Jungle, ou HelloWork
- appliedAt: date ISO 8601 (string)
- offerUrl: URL de l'offre si présente (string ou null)
- city: ville si mentionnée (string ou null)

Retourne UNIQUEMENT un JSON array valide. Ignore les emails qui ne sont PAS des confirmations de candidature.
Format: [{"title":"...","companyName":"...","platform":"...","appliedAt":"...","offerUrl":null,"city":null}]`,
    messages: [
      {
        role: 'user',
        content: `Voici les emails:\n\n${emailsText}\n\nRetourne uniquement le JSON array.`,
      },
    ],
  })

  let parsed: {
    title: string
    companyName: string
    platform: string
    appliedAt: string
    offerUrl: string | null
    city: string | null
  }[] = []

  try {
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const match = text.match(/\[[\s\S]*\]/)
    if (match) parsed = JSON.parse(match[0])
  } catch {}

  return Response.json({ applications: parsed, total: parsed.length })
}
