export type ParsedJobEmail = {
  title: string
  companyName: string
  platform: string
  appliedAt: string
  offerUrl: string | null
  city: string | null
}

// Decode quoted-printable encoding (=20 → space, =\n → nothing, =XX → char)
function decodeQuotedPrintable(str: string): string {
  return str
    .replace(/=\r?\n/g, '')           // soft line breaks
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

// Strip HTML tags and decode common HTML entities
function stripHtml(str: string): string {
  return str
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/?(p|div|tr|td|li|h[1-6])[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/&[a-z]+;/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function prepareBody(raw: string): string {
  const decoded = decodeQuotedPrintable(raw)
  // Detect HTML and strip if needed
  if (/<[a-z][\s\S]*>/i.test(decoded)) {
    return stripHtml(decoded)
  }
  return decoded.replace(/[ \t]+/g, ' ').trim()
}

function detectPlatform(from: string): string {
  const f = from.toLowerCase()
  if (f.includes('apec.fr')) return 'APEC'
  if (f.includes('welcometothejungle')) return 'Welcome to the Jungle'
  if (f.includes('linkedin')) return 'LinkedIn'
  if (f.includes('indeed')) return 'Indeed'
  if (f.includes('hellowork')) return 'HelloWork'
  if (f.includes('francetravail') || f.includes('pole-emploi')) return 'France Travail'
  return 'Inconnu'
}

function clean(s: string): string {
  return s.trim().replace(/\s+/g, ' ')
}

// Try to extract URL from body
function extractUrl(body: string, platform: string): string | null {
  const patterns: Record<string, RegExp> = {
    'Indeed': /https?:\/\/[^\s"']+indeed[^\s"'>)]+/i,
    'LinkedIn': /https?:\/\/[^\s"']+linkedin\.com\/jobs\/[^\s"'>)]+/i,
    'APEC': /https?:\/\/[^\s"']+apec\.fr[^\s"'>)]+/i,
    'Welcome to the Jungle': /https?:\/\/[^\s"']+welcometothejungle[^\s"'>)]+/i,
    'HelloWork': /https?:\/\/[^\s"']+hellowork[^\s"'>)]+/i,
  }
  const re = patterns[platform]
  if (!re) return null
  const m = body.match(re)
  return m ? m[0].replace(/[>)]+$/, '') : null
}

// Indeed: "Votre candidature pour [TITLE] chez [COMPANY]"
// Indeed EN: "You applied to [TITLE] at [COMPANY]"
function parseIndeed(subject: string, body: string): { title: string; companyName: string } {
  let m = subject.match(/(?:candidature pour|applied to|pour le poste de)\s+(.+?)\s+(?:chez|at|pour)\s+(.+?)(?:\s*[-–|]|$)/i)
  if (m) return { title: clean(m[1]), companyName: clean(m[2]) }

  // "Votre candidature chez [COMPANY]" — no title in subject
  m = subject.match(/candidature(?:\s+pour)?\s+(?:chez|pour)\s+(.+?)(?:\s*[-–|]|$)/i)
  if (m) {
    // Try to find title in body
    const bodyTitle = body.match(/(?:poste|titre|job title|position)[^\n:]*[:\s]+([^\n]{5,80})/i)
    return { title: bodyTitle ? clean(bodyTitle[1]) : 'Poste non renseigné', companyName: clean(m[1]) }
  }

  return { title: 'Poste non renseigné', companyName: 'Entreprise non renseignée' }
}

// LinkedIn: "Votre candidature pour [TITLE] chez [COMPANY]"
// LinkedIn EN: "Your application for [TITLE] at [COMPANY]"
function parseLinkedIn(subject: string, body: string): { title: string; companyName: string } {
  let m = subject.match(/(?:candidature pour|application for)\s+(.+?)\s+(?:chez|at)\s+(.+?)(?:\s*[-–|]|$)/i)
  if (m) return { title: clean(m[1]), companyName: clean(m[2]) }

  // "Félicitations ! Vous avez postulé chez [COMPANY]"
  m = subject.match(/(?:postulé|applied)(?:\s+(?:chez|to|à))?\s+(.+?)(?:\s*[-–|]|$)/i)
  if (m) {
    const bodyTitle = body.match(/(?:poste|titre|intitulé|job title)[^\n:]*[:\s]+([^\n]{5,80})/i)
    return { title: bodyTitle ? clean(bodyTitle[1]) : 'Poste non renseigné', companyName: clean(m[1]) }
  }

  return { title: 'Poste non renseigné', companyName: 'Entreprise non renseignée' }
}

// APEC: subjects vary, body has "Intitulé du poste : X\n" and "Entreprise : Y\n"
function parseAPEC(subject: string, body: string): { title: string; companyName: string } {
  // Match label + colon + text until end of line, ignore short/garbage matches
  const titleMatch = body.match(/(?:intitulé du poste|poste|offre)[^\n:]{0,20}:\s*([^\n<]{5,120})/i)
  const companyMatch = body.match(/(?:entreprise|société|recruteur|employeur)[^\n:]{0,20}:\s*([^\n<]{2,120})/i)

  let title = titleMatch ? clean(titleMatch[1]) : 'Poste non renseigné'
  let companyName = companyMatch ? clean(companyMatch[1]) : 'Entreprise non renseignée'

  // Subject fallback: "Candidature - [TITLE] - [COMPANY]"
  if (title === 'Poste non renseigné') {
    const m = subject.match(/candidature\s*[-–]\s*(.+?)\s*[-–]\s*(.+?)(?:\s*[-–|]|$)/i)
    if (m) { title = clean(m[1]); companyName = clean(m[2]) }
  }

  return { title, companyName }
}

// WTTJ: "Ta candidature a bien été transmise à [COMPANY]"
function parseWTTJ(subject: string, body: string): { title: string; companyName: string } {
  const m = subject.match(/transmise à\s+(.+?)(?:\s*[-–|!]|$)/i)
  const companyName = m ? clean(m[1]) : 'Entreprise non renseignée'

  const bodyTitle = body.match(/(?:poste|intitulé|position|job)[^\n:]*[:\s]+([^\n]{5,100})/i)
  const title = bodyTitle ? clean(bodyTitle[1]) : 'Poste non renseigné'

  return { title, companyName }
}

// HelloWork: "Votre candidature pour le poste de [TITLE] chez [COMPANY]"
function parseHelloWork(subject: string, body: string): { title: string; companyName: string } {
  let m = subject.match(/(?:poste de|pour)\s+(.+?)\s+(?:chez|pour)\s+(.+?)(?:\s*[-–|]|$)/i)
  if (m) return { title: clean(m[1]), companyName: clean(m[2]) }

  m = subject.match(/candidature(?:\s+pour)?\s+(.+?)(?:\s*[-–|]|$)/i)
  if (m) return { title: clean(m[1]), companyName: 'Entreprise non renseignée' }

  const bodyTitle = body.match(/(?:poste|titre)[^\n:]*[:\s]+([^\n]{5,100})/i)
  return { title: bodyTitle ? clean(bodyTitle[1]) : 'Poste non renseigné', companyName: 'Entreprise non renseignée' }
}

export function parseJobEmail(email: {
  from: string
  subject: string
  date: string
  body: string
}): ParsedJobEmail {
  const platform = detectPlatform(email.from)
  // Always clean body before regex matching
  const cleanBody = prepareBody(email.body)
  const offerUrl = extractUrl(cleanBody, platform)

  let title = 'Poste non renseigné'
  let companyName = 'Entreprise non renseignée'

  if (platform === 'Indeed') {
    ;({ title, companyName } = parseIndeed(email.subject, cleanBody))
  } else if (platform === 'LinkedIn') {
    ;({ title, companyName } = parseLinkedIn(email.subject, cleanBody))
  } else if (platform === 'APEC') {
    ;({ title, companyName } = parseAPEC(email.subject, cleanBody))
  } else if (platform === 'Welcome to the Jungle') {
    ;({ title, companyName } = parseWTTJ(email.subject, cleanBody))
  } else if (platform === 'HelloWork') {
    ;({ title, companyName } = parseHelloWork(email.subject, cleanBody))
  } else {
    const m = email.subject.match(/(?:pour|for)\s+(.+?)\s+(?:chez|at|à)\s+(.+?)(?:\s*[-–|]|$)/i)
    if (m) { title = clean(m[1]); companyName = clean(m[2]) }
  }

  // Sanitize: strip any leftover HTML/encoding artifacts from extracted values
  title = title.replace(/<[^>]+>/g, '').replace(/=\w{2}/g, '').trim() || 'Poste non renseigné'
  companyName = companyName.replace(/<[^>]+>/g, '').replace(/=\w{2}/g, '').trim() || 'Entreprise non renseignée'

  return {
    title,
    companyName,
    platform,
    appliedAt: email.date,
    offerUrl,
    city: null,
  }
}
