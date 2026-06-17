export const COLUMNS = [
  {
    id: 'wishlist',
    label: 'Wishlist',
    statuses: ['wishlist'],
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    badge: 'bg-gray-200 text-gray-700',
    dot: 'bg-gray-400',
  },
  {
    id: 'to_apply',
    label: 'À postuler',
    statuses: ['to_apply'],
    bg: 'bg-sky-50',
    border: 'border-sky-200',
    text: 'text-sky-800',
    badge: 'bg-sky-200 text-sky-800',
    dot: 'bg-sky-400',
  },
  {
    id: 'applied',
    label: 'Postulé',
    statuses: ['applied'],
    bg: 'bg-yellow-50',
    border: 'border-yellow-200',
    text: 'text-yellow-800',
    badge: 'bg-yellow-200 text-yellow-800',
    dot: 'bg-yellow-400',
  },
  {
    id: 'hr_interview',
    label: 'Entretien RH',
    statuses: ['hr_interview'],
    bg: 'bg-orange-50',
    border: 'border-orange-200',
    text: 'text-orange-800',
    badge: 'bg-orange-200 text-orange-800',
    dot: 'bg-orange-400',
  },
  {
    id: 'tech_interview',
    label: 'Entretien Tech',
    statuses: ['tech_interview'],
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-800',
    badge: 'bg-purple-200 text-purple-800',
    dot: 'bg-purple-400',
  },
  {
    id: 'offer',
    label: 'Offre reçue',
    statuses: ['offer'],
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-800',
    badge: 'bg-green-200 text-green-800',
    dot: 'bg-green-500',
  },
  {
    id: 'rejected',
    label: 'Refus / Abandonné',
    statuses: ['rejected', 'abandoned'],
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-800',
    badge: 'bg-red-200 text-red-800',
    dot: 'bg-red-400',
  },
]

export function formatDate(dateStr) {
  if (!dateStr) return null
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(new Date(dateStr))
}

export function isReminderDue(reminderAt) {
  if (!reminderAt) return false
  return new Date(reminderAt) <= new Date(Date.now() + 86400000)
}
