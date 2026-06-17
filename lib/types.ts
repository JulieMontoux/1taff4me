import type { Application as PrismaApplication } from '@prisma/client'

export type Application = PrismaApplication

export type ApplicationStatus =
  | 'wishlist'
  | 'to_apply'
  | 'applied'
  | 'hr_interview'
  | 'tech_interview'
  | 'offer'
  | 'rejected'
  | 'abandoned'

export type ContractType = 'CDI' | 'CDD' | 'Alternance' | 'Stage' | 'Freelance'

export interface KanbanColumnDef {
  id: string
  label: string
  statuses: string[]
  bg: string
  border: string
  text: string
  badge: string
  dot: string
}

export interface SearchOverlay {
  city: string
  label?: string
  domain?: string
  lat: number
  lng: number
  companies?: Array<{ name: string; lat: number; lng: number }>
}

export interface ScoreResult {
  score: number
  verdict: string
  strengths: string[]
  gaps: string[]
  tips: string[]
  keywords: string[]
}

export interface ApplicationFormData {
  title: string
  companyName: string
  offerUrl: string
  status: string
  contractType: string
  city: string
  remote: boolean
  salary: string
  contactName: string
  contactEmail: string
  contactLinkedin: string
  notes: string
  tags: string[]
  appliedAt: string
  offerDescription?: string
}

export interface StatsResponse {
  byStatus: Array<{ status: string; _count: { status: number } }>
  byContract: Array<{ contractType: string; _count: { contractType: number } }>
  timeline: Array<{ month: string; count: number }>
  total: number
  responseRate: number
  activeCount: number
  offerCount: number
}
