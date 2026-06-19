import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseJobEmail } from '@/lib/parse-job-email'

const PLATFORMS = [
  'apec.fr',
  'indeed.com',
  'indeed.fr',
  'welcometothejungle.com',
  'linkedin.com',
  'hellowork.com',
]

const GMAIL_QUERY = `from:(${PLATFORMS.join(' OR ')}) (candidature OR postuler OR application OR applied OR "votre candidature" OR "your application")`

async function refreshAccessToken(gmailToken: { refreshToken: string; userId: string }) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: gmailToken.refreshToken,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  const expiresAt = new Date(Date.now() + data.expires_in * 1000)
  await prisma.gmailToken.update({
    where: { userId: gmailToken.userId },
    data: { accessToken: data.access_token, expiresAt },
  })
  return data.access_token as string
}

function decodeBase64(str: string) {
  return Buffer.from(str.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf-8')
}

function extractEmailBody(payload: Record<string, unknown>): string {
  if (!payload) return ''

  const mimeType = payload.mimeType as string
  const body = payload.body as { data?: string } | undefined

  if (mimeType === 'text/plain' && body?.data) {
    return decodeBase64(body.data)
  }

  if (mimeType === 'text/html' && body?.data) {
    const html = decodeBase64(body.data)
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
  }

  const parts = payload.parts as Record<string, unknown>[] | undefined
  if (parts) {
    for (const part of parts) {
      const text = extractEmailBody(part)
      if (text) return text
    }
  }

  return ''
}


export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const gmailToken = await prisma.gmailToken.findUnique({
    where: { userId: session.user.id },
  })

  if (!gmailToken) {
    return Response.json({ error: 'Gmail not connected' }, { status: 400 })
  }

  let accessToken = gmailToken.accessToken

  if (new Date(gmailToken.expiresAt) < new Date()) {
    accessToken = await refreshAccessToken(gmailToken) ?? accessToken
  }

  // List matching messages (max 100)
  const listRes = await fetch(
    `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(GMAIL_QUERY)}&maxResults=100`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )

  if (!listRes.ok) {
    return Response.json({ error: 'Gmail API error' }, { status: 502 })
  }

  const listData = await listRes.json()
  const messages: { id: string }[] = listData.messages ?? []

  if (messages.length === 0) {
    return Response.json({ applications: [], total: 0 })
  }

  // Fetch each message
  const emailDetails: { from: string; subject: string; date: string; body: string }[] = []

  await Promise.all(
    messages.slice(0, 50).map(async (msg) => {
      const res = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=full`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      )
      if (!res.ok) return

      const data = await res.json()
      const headers: { name: string; value: string }[] = data.payload?.headers ?? []

      const from = headers.find((h) => h.name === 'From')?.value ?? ''
      const subject = headers.find((h) => h.name === 'Subject')?.value ?? ''
      const date = headers.find((h) => h.name === 'Date')?.value ?? ''
      const body = extractEmailBody(data.payload)

      emailDetails.push({ from, subject, date, body: body.slice(0, 2000) })
    })
  )

  const applications = emailDetails.map(parseJobEmail)

  return Response.json({ applications, total: applications.length })
}
