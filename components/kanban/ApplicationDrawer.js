'use client'

import { useState, useEffect } from 'react'
import { Drawer } from '@/components/ui/Drawer'
import { APPLICATION_STATUSES, CONTRACT_TYPES, STATUS_LABELS } from '@/lib/constants'

const EMPTY_FORM = {
  title: '',
  companyName: '',
  offerUrl: '',
  status: 'wishlist',
  contractType: 'CDI',
  city: '',
  remote: false,
  salary: '',
  contactName: '',
  contactEmail: '',
  contactLinkedin: '',
  notes: '',
  tags: [],
  appliedAt: '',
}

export function ApplicationDrawer({ open, onClose, application, onSaved }) {
  const isEdit = !!application
  const [form, setForm] = useState(EMPTY_FORM)
  const [tagInput, setTagInput] = useState('')
  const [existingTags, setExistingTags] = useState([])
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [errors, setErrors] = useState({})
  const [importUrl, setImportUrl] = useState('')
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState(null)
  const [importSuccess, setImportSuccess] = useState(false)

  useEffect(() => {
    if (!open) return
    setErrors({})
    setTagInput('')
    setConfirmDelete(false)
    setImportUrl('')
    setImportError(null)
    setImportSuccess(false)
    fetch('/api/tags')
      .then((r) => r.json())
      .then((data) => setExistingTags(Array.isArray(data) ? data : []))
      .catch(() => {})
    if (application) {
      setForm({
        ...EMPTY_FORM,
        ...application,
        offerUrl: application.offerUrl ?? '',
        city: application.city ?? '',
        salary: application.salary ?? '',
        contactName: application.contactName ?? '',
        contactEmail: application.contactEmail ?? '',
        contactLinkedin: application.contactLinkedin ?? '',
        notes: application.notes ?? '',
        appliedAt: application.appliedAt
          ? new Date(application.appliedAt).toISOString().slice(0, 10)
          : '',
      })
    } else {
      setForm(EMPTY_FORM)
    }
  }, [open, application])

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }))
  }

  function addTag(raw) {
    const tag = raw.trim().replace(/^#/, '').toLowerCase()
    if (tag && !form.tags.includes(tag)) {
      setForm((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
    }
    setTagInput('')
  }

  function removeTag(tag) {
    setForm((prev) => ({ ...prev, tags: prev.tags.filter((t) => t !== tag) }))
  }

  async function handleImport() {
    const url = importUrl.trim()
    if (!url) return
    setImporting(true)
    setImportError(null)
    setImportSuccess(false)
    try {
      const res = await fetch('/api/parse-offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      })
      const data = await res.json()
      if (!res.ok) {
        setImportError(data.error ?? 'Erreur lors de l\'import')
        return
      }
      setForm((prev) => ({
        ...prev,
        title: data.title || prev.title,
        companyName: data.companyName || prev.companyName,
        city: data.city || prev.city,
        contractType: data.contractType || prev.contractType,
        offerUrl: prev.offerUrl || url,
        notes: data.description
          ? [prev.notes, data.description].filter(Boolean).join('\n\n')
          : prev.notes,
      }))
      setImportSuccess(true)
    } catch {
      setImportError('Erreur réseau')
    } finally {
      setImporting(false)
    }
  }

  function validate() {
    const errs = {}
    if (!form.title.trim()) errs.title = 'Titre requis'
    if (!form.companyName.trim()) errs.companyName = 'Entreprise requise'
    if (form.offerUrl && !isValidUrl(form.offerUrl)) errs.offerUrl = 'URL invalide'
    if (form.contactEmail && !isValidEmail(form.contactEmail)) errs.contactEmail = 'Email invalide'
    if (form.contactLinkedin && !isValidUrl(form.contactLinkedin))
      errs.contactLinkedin = 'URL invalide'
    return errs
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    setSaving(true)
    try {
      const payload = {
        ...form,
        offerUrl: form.offerUrl || undefined,
        city: form.city || undefined,
        salary: form.salary || undefined,
        contactName: form.contactName || undefined,
        contactEmail: form.contactEmail || undefined,
        contactLinkedin: form.contactLinkedin || undefined,
        notes: form.notes || undefined,
        appliedAt: form.appliedAt
          ? new Date(form.appliedAt).toISOString()
          : undefined,
      }

      const res = await fetch(
        isEdit ? `/api/applications/${application.id}` : '/api/applications',
        {
          method: isEdit ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        }
      )

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setErrors({ _global: data.error ?? 'Erreur serveur' })
        return
      }

      onSaved()
      onClose()
    } catch {
      setErrors({ _global: 'Erreur réseau' })
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true)
      return
    }
    setDeleting(true)
    try {
      const res = await fetch(`/api/applications/${application.id}`, {
        method: 'DELETE',
      })
      if (!res.ok) throw new Error()
      onSaved()
      onClose()
    } catch {
      setErrors({ _global: 'Erreur lors de la suppression' })
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={isEdit ? 'Modifier la candidature' : 'Nouvelle candidature'}
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Import depuis URL */}
        {!isEdit && (
          <div className="bg-sky-50 dark:bg-sky-900/20 border border-sky-200 dark:border-sky-800 rounded-lg p-3">
            <p className="text-xs font-semibold text-sky-700 dark:text-sky-300 mb-2">Import depuis une offre</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={importUrl}
                onChange={(e) => { setImportUrl(e.target.value); setImportError(null); setImportSuccess(false) }}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleImport())}
                placeholder="Coller un lien WTTJ, Indeed, Hellowork…"
                className="flex-1 px-3 py-1.5 text-sm border border-sky-300 dark:border-sky-700 rounded-lg outline-none focus:border-sky-500 bg-white dark:bg-gray-800 dark:text-gray-100"
              />
              <button
                type="button"
                onClick={handleImport}
                disabled={importing || !importUrl.trim()}
                className="px-3 py-1.5 bg-sky-600 text-white text-sm rounded-lg hover:bg-sky-700 disabled:opacity-50 transition-colors whitespace-nowrap"
              >
                {importing ? '…' : 'Importer'}
              </button>
            </div>
            {importError && (
              <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{importError}</p>
            )}
            {importSuccess && (
              <p className="mt-1.5 text-xs text-green-700 dark:text-green-400">Champs pré-remplis — vérifie et complète.</p>
            )}
          </div>
        )}

        {errors._global && (
          <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-sm text-red-700 dark:text-red-400">
            {errors._global}
          </div>
        )}

        {/* Poste + Entreprise */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Poste *" error={errors.title}>
            <input
              type="text"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              placeholder="Développeur fullstack"
              className={inputCls(errors.title)}
            />
          </Field>
          <Field label="Entreprise *" error={errors.companyName}>
            <input
              type="text"
              value={form.companyName}
              onChange={(e) => set('companyName', e.target.value)}
              placeholder="Acme Corp"
              className={inputCls(errors.companyName)}
            />
          </Field>
        </div>

        {/* URL offre */}
        <Field label="Lien de l'offre" error={errors.offerUrl}>
          <input
            type="text"
            value={form.offerUrl}
            onChange={(e) => set('offerUrl', e.target.value)}
            placeholder="https://..."
            className={inputCls(errors.offerUrl)}
          />
        </Field>

        {/* Statut + Contrat */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Statut">
            <select value={form.status} onChange={(e) => set('status', e.target.value)} className={inputCls()}>
              {APPLICATION_STATUSES.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s]}</option>
              ))}
            </select>
          </Field>
          <Field label="Contrat">
            <select value={form.contractType} onChange={(e) => set('contractType', e.target.value)} className={inputCls()}>
              {CONTRACT_TYPES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>

        {/* Ville + Remote */}
        <div className="flex gap-3 items-end">
          <Field label="Ville" className="flex-1">
            <input
              type="text"
              value={form.city}
              onChange={(e) => set('city', e.target.value)}
              placeholder="Paris"
              disabled={form.remote}
              className={`${inputCls()} ${form.remote ? 'opacity-40' : ''}`}
            />
          </Field>
          <label className="flex items-center gap-2 pb-2 cursor-pointer select-none flex-shrink-0">
            <input
              type="checkbox"
              checked={form.remote}
              onChange={(e) => set('remote', e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-700 dark:text-gray-300">Remote</span>
          </label>
        </div>

        {/* Salaire + Date candidature */}
        <div className="grid grid-cols-2 gap-3">
          <Field label="Salaire">
            <input
              type="text"
              value={form.salary}
              onChange={(e) => set('salary', e.target.value)}
              placeholder="45k – 55k"
              className={inputCls()}
            />
          </Field>
          <Field label="Date de candidature">
            <input
              type="date"
              value={form.appliedAt}
              onChange={(e) => set('appliedAt', e.target.value)}
              className={inputCls()}
            />
          </Field>
        </div>

        {/* Tags */}
        <Field label="Tags">
          <div className="relative">
            <div
              className={`${inputCls()} flex flex-wrap gap-1.5 h-auto min-h-[2.5rem] py-1.5 cursor-text`}
              onClick={(e) => e.currentTarget.querySelector('input')?.focus()}
            >
              {form.tags.map((tag) => (
                <span key={tag} className="flex items-center gap-1 text-xs px-2 py-0.5 bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 rounded">
                  #{tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:text-violet-900 dark:hover:text-violet-100 leading-none">×</button>
                </span>
              ))}
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(tagInput) }
                  if (e.key === 'Backspace' && !tagInput && form.tags.length > 0) removeTag(form.tags[form.tags.length - 1])
                }}
                onBlur={() => { if (tagInput.trim()) addTag(tagInput) }}
                placeholder={form.tags.length === 0 ? 'react, node… (Entrée)' : ''}
                className="flex-1 min-w-16 outline-none text-sm bg-transparent dark:text-gray-100"
              />
            </div>
            {(() => {
              const q = tagInput.trim().toLowerCase().replace(/^#/, '')
              const suggestions = q ? existingTags.filter((t) => t.includes(q) && !form.tags.includes(t)) : []
              if (suggestions.length === 0) return null
              return (
                <div className="mt-1 flex flex-wrap gap-1">
                  {suggestions.map((s) => (
                    <button key={s} type="button" onMouseDown={(e) => { e.preventDefault(); addTag(s) }}
                      className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 hover:bg-violet-100 dark:hover:bg-violet-900/40 hover:text-violet-700 dark:hover:text-violet-300 rounded transition-colors">
                      #{s}
                    </button>
                  ))}
                </div>
              )
            })()}
          </div>
        </Field>

        {/* Contact */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-3">Contact recruteur</p>
          <div className="space-y-3">
            <Field label="Nom">
              <input type="text" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} placeholder="Marie Dupont" className={inputCls()} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Email" error={errors.contactEmail}>
                <input type="text" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} placeholder="marie@acme.com" className={inputCls(errors.contactEmail)} />
              </Field>
              <Field label="LinkedIn" error={errors.contactLinkedin}>
                <input type="text" value={form.contactLinkedin} onChange={(e) => set('contactLinkedin', e.target.value)} placeholder="linkedin.com/in/…" className={inputCls(errors.contactLinkedin)} />
              </Field>
            </div>
          </div>
        </div>

        {/* Notes */}
        <Field label="Notes">
          <textarea value={form.notes} onChange={(e) => set('notes', e.target.value)} rows={3} placeholder="Impressions, questions à poser, infos entreprise…" className={`${inputCls()} resize-none`} />
        </Field>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
          <div className="flex gap-2">
            {isEdit && (
              <button type="button" onClick={handleDelete} disabled={deleting}
                className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${confirmDelete ? 'bg-red-600 text-white hover:bg-red-700' : 'border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'} disabled:opacity-50`}>
                {deleting ? '…' : confirmDelete ? 'Confirmer ?' : 'Supprimer'}
              </button>
            )}
            <button type="button" onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Annuler
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50 transition-colors">
              {saving ? 'Enregistrement…' : isEdit ? 'Enregistrer' : 'Créer'}
            </button>
          </div>
        </div>
      </form>
    </Drawer>
  )
}

function Field({ label, error, children, className = '' }) {
  return (
    <div className={className}>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}

function inputCls(hasError) {
  return [
    'w-full px-3 py-2 text-sm border rounded-lg outline-none transition-colors',
    'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100',
    hasError
      ? 'border-red-400 focus:ring-2 focus:ring-red-100 dark:focus:ring-red-900/30'
      : 'border-gray-300 dark:border-gray-700 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/30',
  ].join(' ')
}

function isValidUrl(url) {
  try { new URL(url); return true } catch { return false }
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
