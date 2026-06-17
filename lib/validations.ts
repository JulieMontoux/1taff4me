import { z } from 'zod'
import { APPLICATION_STATUSES, CONTRACT_TYPES } from './constants'

const optionalUrl = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z.string().url('URL invalide').optional()
)

const optionalEmail = z.preprocess(
  (v) => (v === '' ? undefined : v),
  z.string().email('Email invalide').optional()
)

const optionalDate = z.string().datetime().nullable().optional()

export const createApplicationSchema = z.object({
  title: z.string().min(1, 'Titre requis').max(200).trim(),
  companyName: z.string().min(1, 'Entreprise requise').max(200).trim(),
  offerUrl: optionalUrl,
  city: z.string().max(100).trim().optional(),
  remote: z.boolean().default(false),
  contractType: z.enum(CONTRACT_TYPES).default('CDI'),
  salary: z.string().max(50).trim().optional(),
  status: z.enum(APPLICATION_STATUSES).default('wishlist'),
  contactName: z.string().max(100).trim().optional(),
  contactEmail: optionalEmail,
  contactLinkedin: optionalUrl,
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50).trim()).default([]),
  appliedAt: optionalDate,
  reminderAt: optionalDate,
})

export const updateApplicationSchema = z.object({
  title: z.string().min(1).max(200).trim().optional(),
  companyName: z.string().min(1).max(200).trim().optional(),
  offerUrl: optionalUrl,
  city: z.string().max(100).trim().optional(),
  remote: z.boolean().optional(),
  contractType: z.enum(CONTRACT_TYPES).optional(),
  salary: z.string().max(50).trim().optional(),
  status: z.enum(APPLICATION_STATUSES).optional(),
  contactName: z.string().max(100).trim().optional(),
  contactEmail: optionalEmail,
  contactLinkedin: optionalUrl,
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string().max(50).trim()).optional(),
  appliedAt: optionalDate,
  reminderAt: optionalDate,
})

export const statusSchema = z.object({
  status: z.enum(APPLICATION_STATUSES),
})

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>
