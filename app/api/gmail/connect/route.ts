import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const SCOPES = ['https://www.googleapis.com/auth/gmail.readonly']

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return Response.json({ error: 'Google OAuth not configured' }, { status: 503 })
  }

  const redirectUri = `${process.env.NEXTAUTH_URL}/api/gmail/callback`

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
  })

  return Response.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params}`,
    302
  )
}
