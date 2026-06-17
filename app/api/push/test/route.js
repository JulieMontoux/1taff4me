import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import webpush from 'web-push'

function configureVapid() {
  if (
    !process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
    !process.env.VAPID_PRIVATE_KEY ||
    !process.env.VAPID_SUBJECT
  ) return false
  webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  )
  return true
}

export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!configureVapid()) {
    return Response.json({ error: 'VAPID keys not configured' }, { status: 503 })
  }

  const subs = await prisma.pushSubscription.findMany({
    where: { userId: session.user.id },
  })

  if (subs.length === 0) {
    return Response.json({ error: 'No active subscription on this account' }, { status: 404 })
  }

  const payload = JSON.stringify({
    title: '1taff4me',
    body: 'Les notifications push fonctionnent !',
    url: '/dashboard',
  })

  let sent = 0
  for (const sub of subs) {
    try {
      await webpush.sendNotification(
        { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
        payload
      )
      sent++
    } catch (err) {
      if (err.statusCode === 410 || err.statusCode === 404) {
        await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
      }
    }
  }

  return Response.json({ ok: true, sent })
}
