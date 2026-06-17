import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import * as cheerio from 'cheerio'

// In-memory rate limit — resets on cold start, good enough for v1
const rateLimitMap = new Map()

function checkRateLimit(userId) {
  const now = Date.now()
  const entry = rateLimitMap.get(userId)
  if (!entry || now - entry.windowStart > 60_000) {
    rateLimitMap.set(userId, { count: 1, windowStart: now })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

function isSafeUrl(urlStr) {
  let url
  try { url = new URL(urlStr) } catch { return false }
  if (!['http:', 'https:'].includes(url.protocol)) return false
  const h = url.hostname.toLowerCase()
  if (['localhost', '127.0.0.1', '::1', '0.0.0.0'].includes(h)) return false
  if (/^(10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.|169\.254\.)/.test(h)) return false
  return true
}

function stripHtml(html) {
  return String(html).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function normalizeContractType(raw) {
  if (!raw) return null
  const t = String(raw).toUpperCase()
  if (t.includes('CDI') || t.includes('FULL_TIME') || t.includes('PERMANENT')) return 'CDI'
  if (t.includes('CDD') || t.includes('TEMPORARY') || t.includes('FIXED')) return 'CDD'
  if (t.includes('INTERN') || t.includes('STAGE')) return 'Stage'
  if (t.includes('ALTERNANCE') || t.includes('APPRENTICE')) return 'Alternance'
  if (t.includes('FREELANCE') || t.includes('CONTRACT')) return 'Freelance'
  return null
}

function parseJsonLd($) {
  const scripts = $('script[type="application/ld+json"]').toArray()
  for (const el of scripts) {
    try {
      const data = JSON.parse($(el).html())
      const items = Array.isArray(data) ? data : [data]
      const job = items.find((d) => d?.['@type'] === 'JobPosting')
      if (!job) continue
      const loc = Array.isArray(job.jobLocation) ? job.jobLocation[0] : job.jobLocation
      return {
        title: job.title ?? null,
        companyName: job.hiringOrganization?.name ?? null,
        city: loc?.address?.addressLocality ?? null,
        contractType: normalizeContractType(
          Array.isArray(job.employmentType) ? job.employmentType[0] : job.employmentType
        ),
        description: job.description ? stripHtml(job.description).slice(0, 600) : null,
      }
    } catch {
      // malformed JSON-LD — skip
    }
  }
  return null
}

function parseOpenGraph($) {
  const get = (sel) => $(sel).attr('content')?.trim() ?? null
  return {
    title:
      get('meta[property="og:title"]') ||
      get('meta[name="title"]') ||
      $('title').text().trim() ||
      null,
    description:
      get('meta[property="og:description"]') ||
      get('meta[name="description"]') ||
      null,
  }
}

function parseSiteSpecific($, hostname) {
  if (hostname.includes('welcometothejungle.com')) {
    return {
      title: $('h1').first().text().trim() || null,
      companyName:
        $('[data-testid="company-name"]').text().trim() ||
        $('a[data-testid="company-link"]').text().trim() ||
        null,
    }
  }
  if (hostname.includes('indeed.fr') || hostname.includes('indeed.com')) {
    return {
      title: $('[itemprop="title"]').text().trim() || null,
      companyName: $('[itemprop="hiringOrganization"]').text().trim() || null,
      city: $('[itemprop="addressLocality"]').text().trim() || null,
    }
  }
  if (hostname.includes('hellowork.com')) {
    return {
      title: $('h1').first().text().trim() || null,
      companyName: $('[data-cy="company-name"]').text().trim() || null,
    }
  }
  return {}
}

export async function POST(request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!checkRateLimit(session.user.id)) {
    return Response.json({ error: 'Limite atteinte (10 req/min)' }, { status: 429 })
  }

  let body
  try { body = await request.json() } catch {
    return Response.json({ error: 'JSON invalide' }, { status: 400 })
  }

  const { url } = body ?? {}
  if (!url || typeof url !== 'string') {
    return Response.json({ error: 'Champ url requis' }, { status: 400 })
  }

  if (!isSafeUrl(url)) {
    return Response.json({ error: 'URL invalide' }, { status: 400 })
  }

  const { hostname } = new URL(url)

  if (hostname.includes('linkedin.com')) {
    return Response.json(
      { error: 'LinkedIn requiert un compte connecté. Utilise WTTJ, Indeed ou Hellowork.' },
      { status: 422 }
    )
  }

  let html
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9,en;q=0.8',
      },
      signal: AbortSignal.timeout(8000),
    })

    if (!res.ok) {
      return Response.json(
        { error: `Le site a répondu avec une erreur ${res.status}` },
        { status: 422 }
      )
    }

    html = await res.text()
  } catch (err) {
    if (err.name === 'TimeoutError') {
      return Response.json({ error: 'Timeout — site trop lent' }, { status: 422 })
    }
    return Response.json({ error: 'Impossible de récupérer la page' }, { status: 422 })
  }

  const $ = cheerio.load(html)

  const jsonLd = parseJsonLd($)
  const og = parseOpenGraph($)
  const specific = parseSiteSpecific($, hostname)

  // Merge: JSON-LD (most structured) > site-specific > OpenGraph
  const result = {
    title: jsonLd?.title || specific?.title || og.title || null,
    companyName: jsonLd?.companyName || specific?.companyName || null,
    city: jsonLd?.city || specific?.city || null,
    contractType: jsonLd?.contractType || null,
    description: jsonLd?.description || og.description || null,
  }

  if (!result.title && !result.companyName) {
    return Response.json(
      { error: 'Aucune donnée extraite. Remplis le formulaire manuellement.' },
      { status: 422 }
    )
  }

  return Response.json(result)
}
