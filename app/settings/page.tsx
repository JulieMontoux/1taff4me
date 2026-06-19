'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { signOut } from 'next-auth/react'
import { DOMAINS } from '@/lib/constants'
import { PushToggle } from '@/components/ui/PushToggle'

function TagInput({ label, values, onChange, placeholder }: { label: string; values: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const [input, setInput] = useState('')

  function add() {
    const v = input.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setInput('')
  }

  function remove(v: string) {
    onChange(values.filter((x: string) => x !== v))
  }

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{label}</label>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {values.map((v) => (
          <span key={v} className="flex items-center gap-1 text-xs bg-brand-50 text-brand-700 px-2 py-1 rounded-full">
            {v}
            <button type="button" onClick={() => remove(v)} className="hover:text-red-500 leading-none ml-0.5">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          onBlur={add}
          placeholder={placeholder}
          className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>
    </div>
  )
}

function DomainCheckboxes({ values, onChange }: { values: string[]; onChange: (v: string[]) => void }) {
  function toggle(d: string) {
    onChange(values.includes(d) ? values.filter((x: string) => x !== d) : [...values, d])
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Domaines favoris</label>
      <div className="flex flex-wrap gap-2">
        {DOMAINS.map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => toggle(d)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
              values.includes(d)
                ? 'bg-brand-600 text-white border-brand-600'
                : 'border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-600'
            }`}
          >
            {d}
          </button>
        ))}
      </div>
    </div>
  )
}

const CV_KEY = '1taff4me_cv'

type GmailApp = {
  title: string
  companyName: string
  platform: string
  appliedAt: string
  offerUrl: string | null
  city: string | null
}

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [reminderDays, setReminderDays] = useState(7)
  const [emailReminders, setEmailReminders] = useState(false)
  const [favoriteDomains, setFavoriteDomains] = useState<string[]>([])
  const [favoriteCities, setFavoriteCities] = useState<string[]>([])
  const [cvText, setCvText] = useState('')
  const [cvSaved, setCvSaved] = useState(false)

  // API token
  const [apiToken, setApiToken] = useState<string | null>(null)
  const [tokenVisible, setTokenVisible] = useState(false)
  const [tokenCopied, setTokenCopied] = useState(false)
  const [regenerating, setRegenerating] = useState(false)

  // iCloud
  const ICLOUD_KEY = '1taff4me_icloud'
  const [icloudEmail, setIcloudEmail] = useState('')
  const [icloudPassword, setIcloudPassword] = useState('')
  const [icloudPasswordVisible, setIcloudPasswordVisible] = useState(false)
  const [icloudImporting, setIcloudImporting] = useState(false)
  const [icloudApps, setIcloudApps] = useState<GmailApp[] | null>(null)
  const [icloudSelected, setIcloudSelected] = useState<Set<number>>(new Set())
  const [icloudImportDone, setIcloudImportDone] = useState(false)
  const [confirmingIcloud, setConfirmingIcloud] = useState(false)
  const [icloudError, setIcloudError] = useState<string | null>(null)

  // Gmail
  const [gmailConnected, setGmailConnected] = useState(false)
  const [gmailImporting, setGmailImporting] = useState(false)
  const [gmailApps, setGmailApps] = useState<GmailApp[] | null>(null)
  const [gmailSelected, setGmailSelected] = useState<Set<number>>(new Set())
  const [gmailImportDone, setGmailImportDone] = useState(false)
  const [confirmingImport, setConfirmingImport] = useState(false)

  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const checkGmailStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/gmail/status')
      if (res.ok) {
        const data = await res.json()
        setGmailConnected(data.connected)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem(CV_KEY)
      if (saved) setCvText(saved)
      const icloud = localStorage.getItem(ICLOUD_KEY)
      if (icloud) {
        const parsed = JSON.parse(icloud)
        setIcloudEmail(parsed.email ?? '')
        setIcloudPassword(parsed.password ?? '')
      }
    } catch {}
    fetch('/api/settings')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((s) => {
        setReminderDays(s.reminderDays ?? 7)
        setEmailReminders(s.emailReminders ?? false)
        setFavoriteDomains(s.favoriteDomains ?? [])
        setFavoriteCities(s.favoriteCities ?? [])
        setApiToken(s.apiToken ?? null)
      })
      .catch(() => setError('Impossible de charger les paramètres.'))
      .finally(() => setLoading(false))

    checkGmailStatus()
  }, [checkGmailStatus])

  // Handle Gmail OAuth callback redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const gmail = params.get('gmail')
    if (gmail === 'connected') {
      setGmailConnected(true)
      window.history.replaceState({}, '', '/settings')
    } else if (gmail === 'error') {
      setError('Erreur lors de la connexion Gmail. Réessaie.')
      window.history.replaceState({}, '', '/settings')
    }
  }, [])

  async function handleRegenerateToken() {
    setRegenerating(true)
    try {
      const res = await fetch('/api/settings', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setApiToken(data.apiToken)
        setTokenVisible(true)
      }
    } finally {
      setRegenerating(false)
    }
  }

  function handleCopyToken() {
    if (!apiToken) return
    navigator.clipboard.writeText(apiToken).then(() => {
      setTokenCopied(true)
      setTimeout(() => setTokenCopied(false), 2000)
    })
  }

  async function handleGmailImport() {
    setGmailImporting(true)
    setGmailApps(null)
    setGmailImportDone(false)
    try {
      const res = await fetch('/api/gmail/import', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setGmailApps(data.applications)
        setGmailSelected(new Set(data.applications.map((_: GmailApp, i: number) => i)))
      } else {
        setError('Erreur lors de l\'import Gmail.')
      }
    } catch {
      setError('Erreur lors de l\'import Gmail.')
    } finally {
      setGmailImporting(false)
    }
  }

  async function handleConfirmGmailImport() {
    if (!gmailApps) return
    setConfirmingImport(true)
    const selected = gmailApps.filter((_, i) => gmailSelected.has(i))
    try {
      const res = await fetch('/api/applications/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          selected.map((a) => ({
            title: a.title,
            companyName: a.companyName,
            offerUrl: a.offerUrl,
            city: a.city,
            status: 'applied',
            appliedAt: a.appliedAt,
            tags: [a.platform],
          }))
        ),
      })
      if (res.ok) {
        setGmailApps(null)
        setGmailImportDone(true)
      }
    } finally {
      setConfirmingImport(false)
    }
  }

  async function handleDisconnectGmail() {
    await fetch('/api/gmail/disconnect', { method: 'DELETE' })
    setGmailConnected(false)
    setGmailApps(null)
  }

  function saveIcloudCredentials() {
    try {
      localStorage.setItem(ICLOUD_KEY, JSON.stringify({ email: icloudEmail, password: icloudPassword }))
    } catch {}
  }

  async function handleIcloudImport() {
    if (!icloudEmail || !icloudPassword) return
    setIcloudImporting(true)
    setIcloudApps(null)
    setIcloudImportDone(false)
    setIcloudError(null)
    saveIcloudCredentials()
    try {
      const res = await fetch('/api/icloud/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: icloudEmail, password: icloudPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setIcloudError(data.error ?? 'Erreur lors de l\'import.')
      } else {
        setIcloudApps(data.applications)
        setIcloudSelected(new Set(data.applications.map((_: GmailApp, i: number) => i)))
      }
    } catch {
      setIcloudError('Erreur réseau.')
    } finally {
      setIcloudImporting(false)
    }
  }

  async function handleConfirmIcloudImport() {
    if (!icloudApps) return
    setConfirmingIcloud(true)
    const selected = icloudApps.filter((_, i) => icloudSelected.has(i))
    try {
      const res = await fetch('/api/applications/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          selected.map((a) => ({
            title: a.title,
            companyName: a.companyName,
            offerUrl: a.offerUrl,
            city: a.city,
            status: 'applied',
            appliedAt: a.appliedAt,
            tags: [a.platform],
          }))
        ),
      })
      if (res.ok) {
        setIcloudApps(null)
        setIcloudImportDone(true)
      }
    } finally {
      setConfirmingIcloud(false)
    }
  }

  function handleCvSave() {
    try {
      localStorage.setItem(CV_KEY, cvText)
      setCvSaved(true)
      setTimeout(() => setCvSaved(false), 2500)
    } catch {}
  }

  function handleCvClear() {
    setCvText('')
    try { localStorage.removeItem(CV_KEY) } catch {}
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reminderDays, emailReminders, favoriteDomains, favoriteCities }),
      })
      if (!res.ok) throw new Error()
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDeleteAccount() {
    if (deleteInput !== 'SUPPRIMER') return
    setDeleting(true)
    try {
      const res = await fetch('/api/account', { method: 'DELETE' })
      if (!res.ok) throw new Error()
      await signOut({ callbackUrl: '/' })
    } catch {
      setError('Erreur lors de la suppression du compte.')
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4 max-w-lg">
        <div className="h-7 bg-gray-200 rounded w-32" />
        <div className="h-48 bg-gray-100 rounded-xl" />
        <div className="h-32 bg-gray-100 rounded-xl" />
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-lg">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Paramètres</h1>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
      )}

      {/* Main settings form */}
      <form onSubmit={handleSave} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-6">
        {/* Reminders */}
        <div>
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Rappels de relance</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Délai de relance (jours)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={reminderDays}
                  onChange={(e) => setReminderDays(Number(e.target.value))}
                  className="flex-1 accent-brand-600"
                />
                <span className="text-sm font-semibold text-brand-700 w-12 text-right">
                  {reminderDays}j
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                Un rappel apparaîtra {reminderDays} jours après chaque candidature envoyée.
              </p>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-gray-100 dark:border-gray-800">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Rappels par email</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">Recevoir un email chaque matin pour les relances dues</p>
              </div>
              <button
                type="button"
                onClick={() => setEmailReminders((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  emailReminders ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    emailReminders ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="py-3 border-t border-gray-100 dark:border-gray-800">
              <PushToggle />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="border-t border-gray-100 pt-5">
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Préférences de recherche</h2>
          <div className="space-y-5">
            <DomainCheckboxes values={favoriteDomains} onChange={setFavoriteDomains} />
            <TagInput
              label="Villes favorites"
              values={favoriteCities}
              onChange={setFavoriteCities}
              placeholder="Paris, Lyon… (Entrée pour ajouter)"
            />
          </div>
        </div>

        <div className="border-t border-gray-100 pt-4 flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 transition-colors"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          {saved && (
            <span className="text-sm text-green-600 font-medium">✓ Paramètres sauvegardés</span>
          )}
        </div>
      </form>

      {/* CV for AI scoring */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">CV (scoring IA)</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Sauvegardé localement dans ton navigateur. Utilisé pour analyser le matching avec tes offres.
          </p>
        </div>
        <textarea
          value={cvText}
          onChange={(e) => setCvText(e.target.value)}
          rows={10}
          placeholder="Colle ici le texte brut de ton CV…"
          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/30 resize-none"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400 dark:text-gray-500">{cvText.length}/20000 caractères</span>
          <div className="flex items-center gap-3">
            {cvSaved && <span className="text-xs text-green-600 dark:text-green-400 font-medium">✓ Sauvegardé</span>}
            {cvText && (
              <button
                type="button"
                onClick={handleCvClear}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Effacer
              </button>
            )}
            <button
              type="button"
              onClick={handleCvSave}
              disabled={!cvText.trim()}
              className="px-4 py-1.5 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-40 transition-colors"
            >
              Sauvegarder
            </button>
          </div>
        </div>
      </div>

      {/* Integrations */}
      <div id="integrations" className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-6">
        <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Intégrations automatiques</h2>

        {/* Extension API token */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Extension navigateur</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Copie ce token dans les options de l'extension pour activer la détection automatique des candidatures (APEC, Indeed, LinkedIn, WTTJ, HelloWork).
            </p>
          </div>
          {apiToken ? (
            <div className="flex items-center gap-2">
              <input
                type={tokenVisible ? 'text' : 'password'}
                readOnly
                value={apiToken}
                className="flex-1 font-mono text-xs bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-700 dark:text-gray-300"
              />
              <button
                type="button"
                onClick={() => setTokenVisible((v) => !v)}
                className="px-3 py-2 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
              >
                {tokenVisible ? 'Cacher' : 'Voir'}
              </button>
              <button
                type="button"
                onClick={handleCopyToken}
                className="px-3 py-2 text-xs bg-brand-600 text-white rounded-lg font-medium hover:bg-brand-700"
              >
                {tokenCopied ? '✓ Copié' : 'Copier'}
              </button>
            </div>
          ) : (
            <p className="text-xs text-gray-400">Chargement…</p>
          )}
          <button
            type="button"
            onClick={handleRegenerateToken}
            disabled={regenerating}
            className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-40"
          >
            {regenerating ? 'Régénération…' : 'Régénérer le token'}
          </button>
        </div>

        {/* Gmail import */}
        <div className="border-t border-gray-100 dark:border-gray-800 pt-5 space-y-3">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Import Gmail</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Connecte Gmail pour importer automatiquement toutes tes candidatures passées à partir des emails de confirmation.
            </p>
          </div>

          {!gmailConnected ? (
            <a
              href="/api/gmail/connect"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Connecter Gmail
            </a>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 rounded-full px-3 py-1 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
                  Gmail connecté
                </span>
                <button
                  type="button"
                  onClick={handleDisconnectGmail}
                  className="text-xs text-gray-400 hover:text-red-500"
                >
                  Déconnecter
                </button>
              </div>

              {!gmailImportDone && (
                <button
                  type="button"
                  onClick={handleGmailImport}
                  disabled={gmailImporting}
                  className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-40"
                >
                  {gmailImporting ? 'Analyse des emails…' : 'Importer les candidatures'}
                </button>
              )}

              {gmailImportDone && (
                <p className="text-sm text-green-600 font-medium">✓ Import terminé !</p>
              )}

              {gmailApps && gmailApps.length === 0 && (
                <p className="text-sm text-gray-500">Aucun email de candidature trouvé.</p>
              )}

              {gmailApps && gmailApps.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600 font-medium">
                    {gmailApps.length} candidature{gmailApps.length > 1 ? 's' : ''} trouvée{gmailApps.length > 1 ? 's' : ''} — sélectionne celles à importer :
                  </p>
                  <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
                    {gmailApps.map((app, i) => (
                      <label key={i} className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50">
                        <input
                          type="checkbox"
                          checked={gmailSelected.has(i)}
                          onChange={() => {
                            const next = new Set(gmailSelected)
                            if (next.has(i)) next.delete(i)
                            else next.add(i)
                            setGmailSelected(next)
                          }}
                          className="mt-0.5 accent-brand-600"
                        />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate">{app.title}</p>
                          <p className="text-xs text-gray-500">{app.companyName} · {app.platform}{app.city ? ` · ${app.city}` : ''}</p>
                          <p className="text-xs text-gray-400">{new Date(app.appliedAt).toLocaleDateString('fr-FR')}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={handleConfirmGmailImport}
                      disabled={gmailSelected.size === 0 || confirmingImport}
                      className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-40"
                    >
                      {confirmingImport ? 'Import…' : `Importer ${gmailSelected.size} candidature${gmailSelected.size > 1 ? 's' : ''}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setGmailApps(null)}
                      className="text-sm text-gray-400 hover:text-gray-600"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* iCloud import */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Import iCloud Mail</h2>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Connecte ton iCloud Mail pour importer tes emails de confirmation de candidature (APEC, Indeed, LinkedIn, WTTJ, HelloWork).
            Utilise un <strong>App-Specific Password</strong> généré sur{' '}
            <a href="https://appleid.apple.com" target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">appleid.apple.com</a>{' '}
            → Sécurité → Mots de passe spécifiques aux apps.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Email iCloud</label>
            <input
              type="email"
              value={icloudEmail}
              onChange={(e) => setIcloudEmail(e.target.value)}
              placeholder="prenom@icloud.com"
              className="w-full border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">App-Specific Password</label>
            <div className="flex gap-2">
              <input
                type={icloudPasswordVisible ? 'text' : 'password'}
                value={icloudPassword}
                onChange={(e) => setIcloudPassword(e.target.value)}
                placeholder="xxxx-xxxx-xxxx-xxxx"
                className="flex-1 font-mono text-sm border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <button
                type="button"
                onClick={() => setIcloudPasswordVisible((v) => !v)}
                className="px-3 text-xs border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50"
              >
                {icloudPasswordVisible ? 'Cacher' : 'Voir'}
              </button>
            </div>
            <p className="text-xs text-gray-400 mt-1">Stocké uniquement dans ton navigateur, jamais en base de données.</p>
          </div>
        </div>

        {icloudError && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{icloudError}</p>
        )}

        {!icloudImportDone ? (
          <button
            type="button"
            onClick={handleIcloudImport}
            disabled={icloudImporting || !icloudEmail || !icloudPassword}
            className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-40"
          >
            {icloudImporting ? 'Analyse des emails…' : 'Importer les candidatures iCloud'}
          </button>
        ) : (
          <p className="text-sm text-green-600 font-medium">✓ Import terminé !</p>
        )}

        {icloudApps && icloudApps.length === 0 && (
          <p className="text-sm text-gray-500">Aucun email de candidature trouvé dans les 90 derniers jours.</p>
        )}

        {icloudApps && icloudApps.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600 font-medium">
              {icloudApps.length} candidature{icloudApps.length > 1 ? 's' : ''} trouvée{icloudApps.length > 1 ? 's' : ''} :
            </p>
            <div className="max-h-64 overflow-y-auto border border-gray-100 rounded-lg divide-y divide-gray-100">
              {icloudApps.map((app, i) => (
                <label key={i} className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50">
                  <input
                    type="checkbox"
                    checked={icloudSelected.has(i)}
                    onChange={() => {
                      const next = new Set(icloudSelected)
                      if (next.has(i)) next.delete(i)
                      else next.add(i)
                      setIcloudSelected(next)
                    }}
                    className="mt-0.5 accent-brand-600"
                  />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{app.title}</p>
                    <p className="text-xs text-gray-500">{app.companyName} · {app.platform}{app.city ? ` · ${app.city}` : ''}</p>
                    <p className="text-xs text-gray-400">{new Date(app.appliedAt).toLocaleDateString('fr-FR')}</p>
                  </div>
                </label>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleConfirmIcloudImport}
                disabled={icloudSelected.size === 0 || confirmingIcloud}
                className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-40"
              >
                {confirmingIcloud ? 'Import…' : `Importer ${icloudSelected.size} candidature${icloudSelected.size > 1 ? 's' : ''}`}
              </button>
              <button
                type="button"
                onClick={() => setIcloudApps(null)}
                className="text-sm text-gray-400 hover:text-gray-600"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="bg-white rounded-xl border border-red-200 p-5 space-y-4">
        <h2 className="text-sm font-semibold text-red-700">Zone dangereuse</h2>
        <p className="text-sm text-gray-600">
          La suppression de votre compte efface définitivement toutes vos candidatures, entreprises cibles, rappels et paramètres. Cette action est irréversible.
        </p>

        {!showDeleteConfirm ? (
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors"
          >
            Supprimer mon compte
          </button>
        ) : (
          <div className="space-y-3 border border-red-200 rounded-lg p-4 bg-red-50">
            <p className="text-sm font-medium text-red-700">
              Tapez <strong>SUPPRIMER</strong> pour confirmer la suppression de votre compte.
            </p>
            <input
              value={deleteInput}
              onChange={(e) => setDeleteInput(e.target.value)}
              placeholder="SUPPRIMER"
              className="w-full border border-red-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteInput !== 'SUPPRIMER' || deleting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 disabled:opacity-40 transition-colors"
              >
                {deleting ? 'Suppression…' : 'Supprimer définitivement'}
              </button>
              <button
                type="button"
                onClick={() => { setShowDeleteConfirm(false); setDeleteInput('') }}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
