import type { KanbanColumnDef } from './types'

export const COLUMNS: KanbanColumnDef[] = [
  {
    id: 'wishlist',
    label: 'Wishlist',
    statuses: ['wishlist'],
    bg: 'bg-gray-50 dark:bg-gray-900/50',
    border: 'border-gray-200 dark:border-gray-700',
    text: 'text-gray-700 dark:text-gray-300',
    badge: 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
    dot: 'bg-gray-400',
  },
  {
    id: 'to_apply',
    label: 'À postuler',
    statuses: ['to_apply'],
    bg: 'bg-sky-50 dark:bg-sky-900/20',
    border: 'border-sky-200 dark:border-sky-800',
    text: 'text-sky-800 dark:text-sky-300',
    badge: 'bg-sky-200 dark:bg-sky-800 text-sky-800 dark:text-sky-200',
    dot: 'bg-sky-400',
  },
  {
    id: 'applied',
    label: 'Postulé',
    statuses: ['applied'],
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-800 dark:text-yellow-300',
    badge: 'bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200',
    dot: 'bg-yellow-400',
  },
  {
    id: 'hr_interview',
    label: 'Entretien RH',
    statuses: ['hr_interview'],
    bg: 'bg-orange-50 dark:bg-orange-900/20',
    border: 'border-orange-200 dark:border-orange-800',
    text: 'text-orange-800 dark:text-orange-300',
    badge: 'bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200',
    dot: 'bg-orange-400',
  },
  {
    id: 'tech_interview',
    label: 'Entretien Tech',
    statuses: ['tech_interview'],
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    border: 'border-purple-200 dark:border-purple-800',
    text: 'text-purple-800 dark:text-purple-300',
    badge: 'bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200',
    dot: 'bg-purple-400',
  },
  {
    id: 'offer',
    label: 'Offre reçue',
    statuses: ['offer'],
    bg: 'bg-green-50 dark:bg-green-900/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-800 dark:text-green-300',
    badge: 'bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200',
    dot: 'bg-green-500',
  },
  {
    id: 'rejected',
    label: 'Refus / Abandonné',
    statuses: ['rejected', 'abandoned'],
    bg: 'bg-red-50 dark:bg-red-900/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-800 dark:text-red-300',
    badge: 'bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200',
    dot: 'bg-red-400',
  },
]

export function formatDate(dateStr: string | Date | null | undefined): string | null {
  if (!dateStr) return null
  return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'short' }).format(new Date(dateStr))
}

export function isReminderDue(reminderAt: string | Date | null | undefined): boolean {
  if (!reminderAt) return false
  return new Date(reminderAt) <= new Date(Date.now() + 86400000)
}
