'use client'

import { useState, useEffect, useRef } from 'react'
import { DOMAINS } from '@/lib/constants'

function CompanyForm({ initial, onSave, onCancel, saving }) {
  const [name, setName] = useState(initial?.name ?? '')
  const [website, setWebsite] = useState(initial?.website ?? '')
  const [domain, setDomain] = useState(initial?.domain ?? '')
  const [cityInput, setCityInput] = useState('')
  const [cities, setCities] = useState(initial?.cities ?? [])
  const [notes, setNotes] = useState(initial?.notes ?? '')
  const [contactLinkedin, setContactLinkedin] = useState(initial?.contactLinkedin ?? '')

  function addCity() {
    const v = cityInput.trim()
    if (v && !cities.includes(v)) setCities((c) => [...c, v])
    setCityInput('')
  }

  function removeCity(c) {
    setCities((prev) => prev.filter((x) => x !== c))
  }

  function handleCityKey(e) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addCity()
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onSave({ name: name.trim(), website, domain, cities, notes, contactLinkedin })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          Nom <span className="text-red-500">*</span>
        </label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ex : Stripe, Doctolib…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Site web</label>
          <input
            type="url"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Domaine</label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">—</option>
            {DOMAINS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Villes</label>
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {cities.map((c) => (
            <span key={c} className="flex items-center gap-1 text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">
              {c}
              <button type="button" onClick={() => removeCity(c)} className="hover:text-red-500 leading-none">×</button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={cityInput}
            onChange={(e) => setCityInput(e.target.value)}
            onKeyDown={handleCityKey}
            onBlur={addCity}
            placeholder="Paris, Lyon… (Entrée pour ajouter)"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">LinkedIn contact</label>
        <input
          value={contactLinkedin}
          onChange={(e) => setContactLinkedin(e.target.value)}
          placeholder="https://linkedin.com/in/…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Équipe, culture, valeurs…"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none"
        />
      </div>

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={saving || !name.trim()}
          className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 transition-colors"
        >
          {saving ? 'Enregistrement…' : initial ? 'Enregistrer' : 'Ajouter'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
        >
          Annuler
        </button>
      </div>
    </form>
  )
}

function CompanyCard({ company, onEdit, onDelete }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 truncate">{company.name}</p>
          {company.domain && (
            <span className="inline-block text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 font-medium mt-0.5">
              {company.domain}
            </span>
          )}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={() => onEdit(company)}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Modifier"
          >
            ✏️
          </button>
          {confirmDelete ? (
            <div className="flex gap-1">
              <button
                onClick={() => onDelete(company.id)}
                className="px-2 py-1 text-xs bg-red-600 text-white rounded-lg font-medium hover:bg-red-700"
              >
                Supprimer
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="px-2 py-1 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
              >
                Non
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              title="Supprimer"
            >
              🗑️
            </button>
          )}
        </div>
      </div>

      {company.cities?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {company.cities.map((c) => (
            <span key={c} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
              📍 {c}
            </span>
          ))}
        </div>
      )}

      {company.website && (
        <a
          href={company.website}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline truncate"
        >
          {company.website.replace(/^https?:\/\//, '')}
        </a>
      )}

      {company.notes && (
        <p className="text-xs text-gray-500 line-clamp-2">{company.notes}</p>
      )}

      {company.contactLinkedin && (
        <a
          href={company.contactLinkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-blue-600 hover:underline"
        >
          LinkedIn contact →
        </a>
      )}
    </div>
  )
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingCompany, setEditingCompany] = useState(null)
  const [saving, setSaving] = useState(false)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/companies')
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setCompanies)
      .catch(() => setError('Impossible de charger les entreprises.'))
      .finally(() => setLoading(false))
  }, [])

  async function handleSave(data) {
    setSaving(true)
    try {
      if (editingCompany) {
        const res = await fetch(`/api/companies/${editingCompany.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error()
        const updated = await res.json()
        setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)))
      } else {
        const res = await fetch('/api/companies', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (!res.ok) throw new Error()
        const created = await res.json()
        setCompanies((prev) => [created, ...prev])
      }
      setShowForm(false)
      setEditingCompany(null)
    } catch {
      alert('Erreur lors de la sauvegarde.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' })
    if (res.ok || res.status === 204) {
      setCompanies((prev) => prev.filter((c) => c.id !== id))
    }
  }

  function openEdit(company) {
    setEditingCompany(company)
    setShowForm(true)
  }

  function openCreate() {
    setEditingCompany(null)
    setShowForm(true)
  }

  function handleCancel() {
    setShowForm(false)
    setEditingCompany(null)
  }

  const filtered = companies.filter((c) =>
    search === '' ||
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.domain?.toLowerCase().includes(search.toLowerCase()) ||
    c.cities?.some((city) => city.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Entreprises cibles</h1>
          {!loading && (
            <p className="text-xs text-gray-500 mt-0.5">
              {companies.length} entreprise{companies.length !== 1 ? 's' : ''} en wishlist
            </p>
          )}
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors"
        >
          + Ajouter
        </button>
      </div>

      {/* Inline form panel */}
      {showForm && (
        <div className="bg-white rounded-xl border border-brand-200 shadow-sm p-5">
          <p className="text-sm font-semibold text-gray-800 mb-4">
            {editingCompany ? `Modifier ${editingCompany.name}` : 'Nouvelle entreprise cible'}
          </p>
          <CompanyForm
            initial={editingCompany}
            onSave={handleSave}
            onCancel={handleCancel}
            saving={saving}
          />
        </div>
      )}

      {/* Search */}
      {companies.length > 3 && (
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filtrer par nom, domaine, ville…"
          className="w-full max-w-xs border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
        />
      )}

      {error && <p className="text-red-600 text-sm">{error}</p>}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-gray-400 text-sm mb-3">
            {search ? 'Aucun résultat pour cette recherche.' : 'Aucune entreprise en wishlist.'}
          </p>
          {!search && !showForm && (
            <button
              onClick={openCreate}
              className="text-sm text-brand-600 hover:text-brand-700 font-medium underline underline-offset-2"
            >
              Ajouter votre première entreprise cible
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((company) => (
            <CompanyCard
              key={company.id}
              company={company}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
