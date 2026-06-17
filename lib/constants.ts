export const DOMAINS = [
  'Tech',
  'Finance',
  'Santé',
  'RH',
  'Marketing',
  'Commerce',
  'Industrie',
  'Conseil',
] as const

export const APPLICATION_STATUSES = [
  'wishlist',
  'to_apply',
  'applied',
  'hr_interview',
  'tech_interview',
  'offer',
  'rejected',
  'abandoned',
] as const

export const CONTRACT_TYPES = ['CDI', 'CDD', 'Alternance', 'Stage', 'Freelance'] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]
export type ContractType = (typeof CONTRACT_TYPES)[number]
export type Domain = (typeof DOMAINS)[number]

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  wishlist: 'Wishlist',
  to_apply: 'À postuler',
  applied: 'Postulé',
  hr_interview: 'Entretien RH',
  tech_interview: 'Entretien Tech',
  offer: 'Offre reçue',
  rejected: 'Refus',
  abandoned: 'Abandonné',
}
