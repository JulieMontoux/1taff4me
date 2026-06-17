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

async function sendPush(sub: { id: string; endpoint: string; p256dh: string; auth: string }, payload: Record<string, unknown>) {
  try {
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify(payload)
    )
    return true
  } catch (err) {
    if ((err as { statusCode?: number }).statusCode === 410 || (err as { statusCode?: number }).statusCode === 404) {
      await prisma.pushSubscription.delete({ where: { id: sub.id } }).catch(() => {})
    }
    return false
  }
}

export async function POST(req: Request) {
  const cronSecret = process.env.CRON_SECRET
  if (cronSecret) {
    const auth = req.headers.get('authorization')
    if (auth !== `Bearer ${cronSecret}`) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const vapidReady = configureVapid()

  const dueApps = await prisma.application.findMany({
    where: {
      reminderAt: { lte: new Date() },
      status: { in: ['applied', 'hr_interview', 'tech_interview'] },
    },
    include: {
      user: {
        include: {
          settings: true,
          pushSubscriptions: true,
        },
      },
    },
  })

  // Group by user
  const byUser = new Map()
  for (const app of dueApps) {
    const uid = app.userId
    if (!byUser.has(uid)) byUser.set(uid, { user: app.user, apps: [] })
    byUser.get(uid).apps.push(app)
  }

  let pushSent = 0
  let pushFailed = 0
  let emailQueued = 0

  for (const { user, apps } of byUser.values()) {
    // Push notifications
    if (vapidReady) {
      const subs = user.pushSubscriptions ?? []
      if (subs.length > 0) {
        const payload = apps.length === 1
          ? {
              title: 'Rappel de relance',
              body: `Relancez ${apps[0].companyName} — ${apps[0].title}`,
              url: '/dashboard',
            }
          : {
              title: `${apps.length} rappels de relance`,
              body: `Vous avez ${apps.length} candidatures à relancer`,
              url: '/dashboard',
            }

        for (const sub of subs) {
          const ok = await sendPush(sub, payload)
          if (ok) pushSent++
          else pushFailed++
        }
      }
    }

    // Email reminders (Resend — only if opted in and key configured)
    if (user.settings?.emailReminders && process.env.RESEND_API_KEY && user.email) {
      try {
        await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'noreply@1taff4me.com',
            to: user.email,
            subject: `Rappel de relance — ${apps.length} candidature${apps.length > 1 ? 's' : ''}`,
            html: buildEmailHtml(apps),
          }),
        })
        emailQueued++
      } catch {}
    }
  }

  return Response.json({
    ok: true,
    usersProcessed: byUser.size,
    appsFound: dueApps.length,
    pushSent,
    pushFailed,
    emailQueued,
  })
}

function buildEmailHtml(apps: { title: string; companyName: string; offerUrl?: string | null }[]) {
  const rows = apps
    .map(
      (a) =>
        `<tr>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">${a.title}</td>
          <td style="padding:8px 12px;border-bottom:1px solid #f3f4f6">${a.companyName}</td>
          ${a.offerUrl ? `<td style="padding:8px 12px;border-bottom:1px solid #f3f4f6"><a href="${a.offerUrl}" style="color:#7c3aed">Voir l'offre</a></td>` : '<td></td>'}
        </tr>`
    )
    .join('')

  return `<!DOCTYPE html><html><body style="font-family:sans-serif;color:#111827;max-width:520px;margin:0 auto;padding:24px">
    <h2 style="color:#7c3aed;margin-bottom:16px">Rappels de relance — 1taff4me</h2>
    <p>Vous avez ${apps.length} candidature${apps.length > 1 ? 's' : ''} à relancer :</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0">
      <thead><tr style="background:#f9fafb;font-size:12px;text-transform:uppercase;color:#6b7280">
        <th style="padding:8px 12px;text-align:left">Poste</th>
        <th style="padding:8px 12px;text-align:left">Entreprise</th>
        <th style="padding:8px 12px;text-align:left">Offre</th>
      </tr></thead>
      <tbody>${rows}</tbody>
    </table>
    <a href="${process.env.NEXTAUTH_URL || 'https://1taff4me.vercel.app'}/dashboard" style="display:inline-block;padding:10px 20px;background:#7c3aed;color:white;border-radius:8px;text-decoration:none;font-weight:600">
      Ouvrir 1taff4me
    </a>
  </body></html>`
}
