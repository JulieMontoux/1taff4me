'use client'

import { useState, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import { DOMAINS } from '@/lib/constants'

function TagInput({ label, values, onChange, placeholder }) {
  const [input, setInput] = useState('')

  function add() {
    const v = input.trim()
    if (v && !values.includes(v)) onChange([...values, v])
    setInput('')
  }

  function remove(v) {
    onChange(values.filter((x) => x !== v))
  }

  function handleKey(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      add()
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
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

function DomainCheckboxes({ values, onChange }) {
  function toggle(d) {
    onChange(values.includes(d) ? values.filter((x) => x !== d) : [...values, d])
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">Domaines favoris</label>
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

export default function SettingsPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  const [reminderDays, setReminderDays] = useState(7)
  const [emailReminders, setEmailReminders] = useState(false)
  const [favoriteDomains, setFavoriteDomains] = useState([])
  const [favoriteCities, setFavoriteCities] = useState([])

  const [deleteInput, setDeleteInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((s) => {
        setReminderDays(s.reminderDays ?? 7)
        setEmailReminders(s.emailReminders ?? false)
        setFavoriteDomains(s.favoriteDomains ?? [])
        setFavoriteCities(s.favoriteCities ?? [])
      })
      .catch(() => setError('Impossible de charger les paramètres.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(e) {
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
      <h1 className="text-xl font-bold text-gray-900">Paramètres</h1>

      {error && (
        <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-4 py-3">{error}</p>
      )}

      {/* Main settings form */}
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-gray-200 p-5 space-y-6">
        {/* Reminders */}
        <div>
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Rappels de relance</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
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

            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-700">Rappels par email</p>
                <p className="text-xs text-gray-400">Recevoir un email chaque matin pour les relances dues</p>
              </div>
              <button
                type="button"
                onClick={() => setEmailReminders((v) => !v)}
                className={`relative w-11 h-6 rounded-full transition-colors ${
                  emailReminders ? 'bg-brand-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                    emailReminders ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
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
