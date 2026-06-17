'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DOMAINS, CONTRACT_TYPES } from '@/lib/constants'

async function geocodeCity(query: string) {
  const res = await fetch(
    `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&type=municipality&limit=5`
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.features ?? []).map((f: { properties: { label: string; city?: string; name: string }; geometry: { coordinates: number[] } }) => ({
    label: f.properties.label,
    city: f.properties.city ?? f.properties.name,
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
  }))
}

function AddToWishlistButton({ company, city, domain }: { company: { name: string; website?: string; domain?: string }; city: string | null; domain: string }) {
  const [status, setStatus] = useState('idle')

  async function handleAdd() {
    setStatus('loading')
    try {
      const res = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: company.name,
          website: company.website ?? '',
          domain: domain || company.domain || '',
          cities: city ? [city] : [],
          notes: '',
        }),
      })
      setStatus(res.ok ? 'done' : 'error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'done') {
    return (
      <span className="text-xs text-green-600 font-medium">✓ Ajouté</span>
    )
  }

  return (
    <button
      onClick={handleAdd}
      disabled={status === 'loading'}
      className="text-xs px-2.5 py-1 border border-brand-300 text-brand-700 rounded-lg hover:bg-brand-50 transition-colors disabled:opacity-40"
    >
      {status === 'loading' ? '…' : status === 'error' ? 'Erreur, réessayer' : '+ Wishlist'}
    </button>
  )
}

function SearchResultCard({ company, city, domain }: { company: { name: string; address?: string; domain?: string; size?: string; offerUrl?: string; website?: string }; city: string | null; domain: string }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 flex items-start justify-between gap-3">
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 truncate">{company.name}</p>
        {company.address && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{company.address}</p>}
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {company.domain && (
            <span className="text-xs bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full">{company.domain}</span>
          )}
          {company.size && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{company.size}</span>
          )}
        </div>
      </div>
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <AddToWishlistButton company={company} city={city} domain={domain} />
        {company.offerUrl && (
          <a
            href={company.offerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline"
          >
            Voir l&apos;offre →
          </a>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  const router = useRouter()
  const [cityInput, setCityInput] = useState('')
  type CityOption = { label: string; city: string; lat: number; lng: number }
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null)
  const [suggestions, setSuggestions] = useState<CityOption[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [domain, setDomain] = useState('')
  const [contractType, setContractType] = useState('')
  const [geocoding, setGeocoding] = useState(false)
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const inputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (cityInput.length < 2) {
      setSuggestions([])
      return
    }
    clearTimeout(debounceRef.current ?? undefined)
    debounceRef.current = setTimeout(async () => {
      const results = await geocodeCity(cityInput)
      setSuggestions(results)
      setShowSuggestions(true)
    }, 300)
    return () => clearTimeout(debounceRef.current ?? undefined)
  }, [cityInput])

  function selectCity(suggestion: { label: string; city: string; lat: number; lng: number }) {
    setSelectedCity(suggestion)
    setCityInput(suggestion.label)
    setSuggestions([])
    setShowSuggestions(false)
  }

  async function handleViewOnMap() {
    let cityData = selectedCity

    if (!cityData && cityInput.length >= 2) {
      setGeocoding(true)
      const results = await geocodeCity(cityInput)
      setGeocoding(false)
      if (results.length === 0) return
      cityData = results[0]
      setSelectedCity(cityData)
    }

    if (!cityData) return

    const overlay = {
      city: cityData.city,
      label: cityData.label,
      lat: cityData.lat,
      lng: cityData.lng,
      domain: domain || null,
      contractType: contractType || null,
      companies: [],
    }
    localStorage.setItem('1taff4me_searchOverlay', JSON.stringify(overlay))
    router.push('/map')
  }

  const canSearch = cityInput.length >= 2

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recherche Géo-Métier</h1>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 space-y-4">
        {/* City */}
        <div className="relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ville</label>
          <input
            ref={inputRef}
            type="text"
            value={cityInput}
            onChange={(e) => {
              setCityInput(e.target.value)
              if (selectedCity && e.target.value !== selectedCity.label) {
                setSelectedCity(null)
              }
            }}
            onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder="Ex : Paris, Lyon, Bordeaux…"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 overflow-hidden">
              {suggestions.map((s) => (
                <li key={`${s.lat},${s.lng}`}>
                  <button
                    type="button"
                    onMouseDown={() => selectCity(s)}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                  >
                    {s.label}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Domain */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Domaine</label>
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Tous les domaines</option>
            {DOMAINS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
        </div>

        {/* Contract type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contrat</label>
          <select
            value={contractType}
            onChange={(e) => setContractType(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">Tous les contrats</option>
            {CONTRACT_TYPES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            disabled={!canSearch}
            className="flex-1 px-4 py-2 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Rechercher
          </button>
          <button
            type="button"
            onClick={handleViewOnMap}
            disabled={!canSearch || geocoding}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {geocoding ? (
              <span className="inline-block w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              '🗺️'
            )}
            Voir sur la carte
          </button>
        </div>
      </div>

      {/* Results placeholder — replaced by real results when #14-15 ship */}
      <div className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 text-center">
        <p className="text-gray-400 text-sm">
          Les résultats de recherche (France Travail + enrichissement entreprises) seront affichés ici.
        </p>
        <p className="text-gray-300 text-xs mt-1">Chaque résultat aura un bouton &quot;+ Wishlist&quot; pour l&apos;ajouter à vos entreprises cibles.</p>
      </div>
    </div>
  )
}
