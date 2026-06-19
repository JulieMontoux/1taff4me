import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { parseJobEmail } from '@/lib/parse-job-email'

const PLATFORMS = ['apec.fr', 'indeed', 'welcometothejungle', 'linkedin', 'hellowork', 'francetravail', 'pole-emploi']

const IMAP_HOST = 'imap.mail.me.com'
const IMAP_PORT = 993

export async function POST(request: Request) {
  try {
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
      return Response.json({ error: 'email et password requis' }, { status: 400 })
    }

    const { ImapFlow } = await import('imapflow')

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

    const rawEmails: { from: string; subject: string; date: string; body: string }[] = []

    try {
      await client.mailboxOpen('INBOX')

      const since = new Date()
      since.setDate(since.getDate() - 90)

      const uids = await client.search({ since })
      const uidList = Array.isArray(uids) ? uids : []
      const slice = uidList.slice(-200)

      if (slice.length > 0) {
        for await (const msg of client.fetch(
          slice.join(','),
          { envelope: true, bodyParts: ['1'] }
        )) {
          if (!msg.envelope) continue

          const from = msg.envelope.from?.[0]?.address ?? ''
          const subject = msg.envelope.subject ?? ''
          const date = msg.envelope.date?.toISOString() ?? ''

          const lowerFrom = from.toLowerCase()
          if (!PLATFORMS.some((p) => lowerFrom.includes(p))) continue

          const lowerSubject = subject.toLowerCase()
          const isConfirmation =
            lowerSubject.includes('candidature') ||
            lowerSubject.includes('postuler') ||
            lowerSubject.includes('postulation') ||
            lowerSubject.includes('application') ||
            lowerSubject.includes('applied')

          if (!isConfirmation) continue

          let bodyText = ''
          const part = msg.bodyParts?.get('1')
          if (part) bodyText = part.toString().slice(0, 3000)

          rawEmails.push({ from, subject, date, body: bodyText })
          if (rawEmails.length >= 60) break
        }
      }
    } finally {
      try { await client.logout() } catch {}
    }

    if (rawEmails.length === 0) {
      return Response.json({ applications: [], total: 0 })
    }

    const applications = rawEmails.map(parseJobEmail)

    return Response.json({ applications, total: applications.length })

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json({ error: `Erreur serveur : ${msg}` }, { status: 500 })
  }
}
