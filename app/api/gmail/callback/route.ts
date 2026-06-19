import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.redirect(new URL('/auth/signin', request.url), 302)
  }

  const code = request.nextUrl.searchParams.get('code')
  const error = request.nextUrl.searchParams.get('error')

  if (error || !code) {
    return Response.redirect(new URL('/settings?gmail=error', request.url), 302)
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const redirectUri = `${process.env.NEXTAUTH_URL}/api/gmail/callback`

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return Response.redirect(new URL('/settings?gmail=error', request.url), 302)
  }

  const tokens = await tokenRes.json()

  await prisma.gmailToken.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
    update: {
      accessToken: tokens.access_token,
      ...(tokens.refresh_token && { refreshToken: tokens.refresh_token }),
      expiresAt: new Date(Date.now() + tokens.expires_in * 1000),
    },
  })

  return Response.redirect(new URL('/settings?gmail=connected', request.url), 302)
}
