'use client'

import { useState, useRef } from 'react'
import { CONTRACT_TYPES, APPLICATION_STATUSES, STATUS_LABELS } from '@/lib/constants'
import type { ApplicationStatus, ContractType } from '@/lib/constants'

interface Props {
  open: boolean
  onClose: () => void
  onImported?: () => void
}

interface CsvRow { [key: string]: string }

interface ImportRow {
  title: string
  companyName: string
  city: string | null
  offerUrl: string | null
  contractType: string
  salary: string | null
  status: string
  notes: string | null
  appliedAt: string | null
  remote: boolean
  tags: string[]
}

// --- CSV parser (handles quoted fields + BOM) ---
function parseCSVRow(line: string): string[] {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (c === ',' && !inQuotes) {
      result.push(current)
      current = ''
    } else {
      current += c
    }
  }
  result.push(current)
  return result
}

function parseCSV(text: string): CsvRow[] {
  // Strip BOM
  const clean = text.replace(/^﻿/, '')
  const lines = clean.split(/\r?\n/)
  if (lines.length < 2) return []
  const headers = parseCSVRow(lines[0]).map((h) => h.trim())
  const rows: CsvRow[] = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const values = parseCSVRow(lines[i])
    const row: CsvRow = {}
    headers.forEach((h, idx) => { row[h] = (values[idx] ?? '').trim() })
    rows.push(row)
  }
  return rows
}

// --- Column mapping ---
const COL_MAP = {
  title: ['titre du poste', 'job title', 'poste', 'position', 'title', 'intitulé du poste'],
  companyName: ['entreprise', 'company name', 'company', 'société', 'employer'],
  city: ['ville', 'job location', 'location', 'city', 'lieu'],
  offerUrl: ['url offre', 'job url', 'job_url', 'offer url', 'url', 'lien', 'apply url'],
  contractType: ['contrat', 'contract type', 'employment type', 'type de contrat'],
  salary: ['salaire', 'salary', 'rémunération', 'compensation'],
  status: ['statut', 'status', 'état'],
  notes: ['notes', 'description', 'commentaires'],
  appliedAt: ['date de candidature', 'application date', 'date postulation', 'applied date'],
  remote: ['remote', 'télétravail', 'work from home'],
  tags: ['tags', 'étiquettes', 'labels'],
}

function getField(row: CsvRow, aliases: string[]): string | null {
  for (const alias of aliases) {
    const key = Object.keys(row).find((k) => k.toLowerCase() === alias)
    if (key && row[key]) return row[key]
  }
  return null
}

const STATUS_MAP = {
  'wishlist': 'wishlist',
  'à postuler': 'to_apply',
  'postulé': 'applied',
  'postulée': 'applied',
  'entretien rh': 'hr_interview',
  'entretien tech': 'tech_interview',
  'offre reçue': 'offer',
  'offre': 'offer',
  'refus': 'rejected',
  'refusée': 'rejected',
  'abandonné': 'abandoned',
  'abandonnée': 'abandoned',
  // English
  'applied': 'applied',
  'interviewing': 'hr_interview',
  'offer': 'offer',
  'rejected': 'rejected',
}

function normalizeContractType(raw: string | null): string | null {
  if (!raw) return null
  const t = raw.toUpperCase()
  if (t.includes('CDI') || t.includes('FULL_TIME') || t.includes('PERMANENT')) return 'CDI'
  if (t.includes('CDD') || t.includes('TEMPORARY')) return 'CDD'
  if (t.includes('ALTERNANCE') || t.includes('APPRENTICE')) return 'Alternance'
  if (t.includes('STAGE') || t.includes('INTERN')) return 'Stage'
  if (t.includes('FREELANCE') || t.includes('CONTRACT')) return 'Freelance'
  if (CONTRACT_TYPES.includes(raw as ContractType)) return raw as ContractType
  return null
}

function parseDate(raw: string | null): string | null {
  if (!raw) return null
  // dd/mm/yyyy
  const fr = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (fr) return new Date(`${fr[3]}-${fr[2].padStart(2,'0')}-${fr[1].padStart(2,'0')}`).toISOString()
  const d = new Date(raw)
  return isNaN(d.getTime()) ? null : d.toISOString()
}

function mapRow(row: CsvRow): ImportRow | null {
  const title = getField(row, COL_MAP.title)
  const companyName = getField(row, COL_MAP.companyName)
  if (!title || !companyName) return null

  const rawStatus = getField(row, COL_MAP.status)
  const status = rawStatus
    ? (STATUS_MAP[rawStatus.toLowerCase() as keyof typeof STATUS_MAP] ?? 'wishlist')
    : 'wishlist'

  const rawTags = getField(row, COL_MAP.tags)
  const tags = rawTags ? rawTags.split(/[,;]/).map((t) => t.trim()).filter(Boolean) : []

  const rawRemote = getField(row, COL_MAP.remote)
  const remote = rawRemote ? ['oui', 'yes', 'true', '1'].includes(rawRemote.toLowerCase()) : false

  return {
    title,
    companyName,
    city: getField(row, COL_MAP.city) || null,
    offerUrl: getField(row, COL_MAP.offerUrl) || null,
    contractType: normalizeContractType(getField(row, COL_MAP.contractType)) ?? 'CDI',
    salary: getField(row, COL_MAP.salary) || null,
    status,
    notes: getField(row, COL_MAP.notes) || null,
    appliedAt: parseDate(getField(row, COL_MAP.appliedAt)),
    remote,
    tags,
  }
}

// --- Component ---
export function ImportModal({ open, onClose, onImported }: Props) {
  const [rows, setRows] = useState<ImportRow[]>([])
  const [fileName, setFileName] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<{ imported: number; skipped: number[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  function reset() {
    setRows([])
    setFileName(null)
    setResult(null)
    setError(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)
    setError(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = (ev.target as FileReader).result as string
      const raw = parseCSV(text)
      const mapped = raw.map(mapRow).filter((r): r is ImportRow => r !== null)
      setRows(mapped)
      if (mapped.length === 0) {
        setError('Aucune ligne valide détectée. Vérifie que le fichier a les colonnes "Titre du poste" et "Entreprise" (ou équivalents anglais).')
      }
    }
    reader.readAsText(file, 'utf-8')
  }

  async function handleImport() {
    if (rows.length === 0) return
    setImporting(true)
    setError(null)
    try {
      const res = await fetch('/api/applications/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rows),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de l\'import')
        return
      }
      setResult(data)
      onImported?.()
    } catch {
      setError('Erreur réseau')
    } finally {
      setImporting(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { reset(); onClose() }} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Import CSV</h2>
          <button onClick={() => { reset(); onClose() }} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
        </div>

        {/* Format hint */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-xs text-gray-500 dark:text-gray-400 space-y-1">
          <p className="font-medium text-gray-700 dark:text-gray-300">Formats acceptés :</p>
          <ul className="list-disc list-inside space-y-0.5">
            <li>Export 1taff4me (↓ CSV du dashboard)</li>
            <li>LinkedIn — Mes candidatures (CSV)</li>
            <li>Tout CSV avec colonnes &quot;Job Title&quot; + &quot;Company&quot;</li>
          </ul>
        </div>

        {/* File picker */}
        {!result && (
          <div>
            <label className="block">
              <div className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${
                fileName
                  ? 'border-brand-400 bg-brand-50 dark:bg-brand-900/20'
                  : 'border-gray-300 dark:border-gray-700 hover:border-brand-400 dark:hover:border-brand-600'
              }`}>
                {fileName ? (
                  <div>
                    <p className="text-sm font-medium text-brand-700 dark:text-brand-400">{fileName}</p>
                    {rows.length > 0 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {rows.length} candidature{rows.length > 1 ? 's' : ''} détectée{rows.length > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Glisse un fichier CSV ici</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">ou clique pour parcourir</p>
                  </div>
                )}
              </div>
              <input ref={inputRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
            </label>
          </div>
        )}

        {/* Preview */}
        {rows.length > 0 && !result && (
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
            <div className="bg-gray-50 dark:bg-gray-800 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400">
              Aperçu ({Math.min(3, rows.length)}/{rows.length})
            </div>
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {rows.slice(0, 3).map((r, i) => (
                <div key={i} className="px-3 py-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{r.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {r.companyName}{r.city ? ` · ${r.city}` : ''} · {STATUS_LABELS[r.status as ApplicationStatus] ?? r.status}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        {/* Success */}
        {result && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg px-4 py-3 text-sm text-green-700 dark:text-green-400">
            <p className="font-semibold">✓ {result.imported} candidature{result.imported > 1 ? 's' : ''} importée{result.imported > 1 ? 's' : ''}</p>
            {result.skipped?.length > 0 && (
              <p className="text-xs mt-1 text-green-600 dark:text-green-500">{result.skipped.length} ligne{result.skipped.length > 1 ? 's' : ''} ignorée{result.skipped.length > 1 ? 's' : ''} (données manquantes)</p>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-1">
          {result ? (
            <>
              <button onClick={reset} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Importer un autre fichier
              </button>
              <button onClick={() => { reset(); onClose() }} className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors">
                Fermer
              </button>
            </>
          ) : (
            <>
              <button onClick={() => { reset(); onClose() }} className="flex-1 px-4 py-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Annuler
              </button>
              <button
                onClick={handleImport}
                disabled={rows.length === 0 || importing}
                className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 transition-colors"
              >
                {importing ? 'Import en cours…' : `Importer ${rows.length > 0 ? rows.length : ''}`}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
