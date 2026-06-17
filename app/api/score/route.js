import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'

const schema = z.object({
  cvText: z.string().min(50).max(20000),
  jobTitle: z.string().min(1).max(200),
  companyName: z.string().min(1).max(200),
  city: z.string().max(100).optional(),
  contractType: z.string().max(50).optional(),
  notes: z.string().max(5000).optional(),
  offerDescription: z.string().max(10000).optional(),
})

const SYSTEM_PROMPT = `Tu es un expert en recrutement et analyse de candidatures.
Tu reçois un CV et une offre d'emploi, et tu dois évaluer le matching.
Réponds UNIQUEMENT avec un objet JSON valide (pas de markdown, pas de texte autour), avec cette structure exacte :
{
  "score": <nombre entier 0-100>,
  "verdict": "<une phrase courte ex: Bon profil, quelques lacunes>",
  "strengths": ["<point fort 1>", "<point fort 2>", "<point fort 3>"],
  "gaps": ["<manque 1>", "<manque 2>"],
  "tips": ["<conseil actionnable 1>", "<conseil actionnable 2>", "<conseil actionnable 3>"],
  "keywords": ["<mot-clé manquant 1>", "<mot-clé manquant 2>"]
}
Sois précis, concis, et bienveillant. Les listes : 2-4 éléments max.`

export async function POST(req) {
  const session = await getServerSession(authOptions)
  if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  if (!process.env.ANTHROPIC_API_KEY) {
    return Response.json({ error: 'ANTHROPIC_API_KEY non configurée' }, { status: 503 })
  }

  let body
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { cvText, jobTitle, companyName, city, contractType, notes, offerDescription } = parsed.data

  const userMessage = `## CV du candidat
${cvText}

## Offre d'emploi
Poste : ${jobTitle}
Entreprise : ${companyName}${city ? `\nVille : ${city}` : ''}${contractType ? `\nContrat : ${contractType}` : ''}${offerDescription ? `\n\nDescription de l'offre :\n${offerDescription}` : ''}${notes ? `\n\nNotes sur l'offre :\n${notes}` : ''}

Analyse le matching entre ce CV et cette offre. Retourne uniquement le JSON demandé.`

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMessage }],
    })

    const raw = message.content[0]?.text?.trim()
    if (!raw) throw new Error('Empty response')

    const result = JSON.parse(raw)

    if (typeof result.score !== 'number' || !Array.isArray(result.strengths)) {
      throw new Error('Invalid response shape')
    }

    return Response.json(result)
  } catch (err) {
    if (err instanceof SyntaxError) {
      return Response.json({ error: 'Réponse IA invalide, réessaie.' }, { status: 500 })
    }
    return Response.json({ error: 'Erreur lors de l\'analyse IA' }, { status: 500 })
  }
}
