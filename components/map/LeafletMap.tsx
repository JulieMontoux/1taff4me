'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Application, SearchOverlay } from '@/lib/types'

interface Props {
  applications: Application[]
  searchOverlay: SearchOverlay | null
}

interface MarkerData {
  app: Application
  position: [number, number]
}

const STATUS_COLORS = {
  wishlist: '#9ca3af',
  to_apply: '#38bdf8',
  applied: '#fbbf24',
  hr_interview: '#fb923c',
  tech_interview: '#a78bfa',
  offer: '#34d399',
  rejected: '#f87171',
  abandoned: '#fca5a5',
}

const STATUS_LABELS = {
  wishlist: 'Wishlist',
  to_apply: 'À postuler',
  applied: 'Postulée',
  hr_interview: 'Entretien RH',
  tech_interview: 'Entretien tech',
  offer: 'Offre',
  rejected: 'Refusée',
  abandoned: 'Abandonnée',
}

const COMPANY_COLOR = '#7c3aed'

function makeIcon(color: string, size: number = 14) {
  return L.divIcon({
    className: '',
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 1px 3px rgba(0,0,0,0.3)"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -(size / 2 + 2)],
  })
}

function makeCompanyIcon() {
  return L.divIcon({
    className: '',
    html: `<div style="width:18px;height:18px;border-radius:4px;background:${COMPANY_COLOR};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.35);display:flex;align-items:center;justify-content:center">
      <span style="font-size:10px;line-height:1">🏢</span>
    </div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
    popupAnchor: [0, -12],
  })
}

async function geocodeCity(city: string) {
  try {
    const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(city)}&type=municipality&limit=1`
    const res = await fetch(url)
    if (res.ok) {
      const data = await res.json()
      if (data.features?.length > 0) {
        const [lng, lat] = data.features[0].geometry.coordinates
        return [lat, lng]
      }
    }
  } catch {}

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city + ', France')}&format=json&limit=1`
    const res = await fetch(url, { headers: { 'User-Agent': '1taff4me/1.0' } })
    if (res.ok) {
      const data = await res.json()
      if (data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
      }
    }
  } catch {}

  return null
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length > 0) {
      map.fitBounds(positions, { padding: [40, 40], maxZoom: 12 })
    }
  }, [positions, map])
  return null
}

function ZoomToPoint({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap()
  useEffect(() => {
    if (lat != null && lng != null) {
      map.setView([lat, lng], 11, { animate: true })
    }
  }, [lat, lng, map])
  return null
}

export default function LeafletMap({ applications, searchOverlay }: Props) {
  const [markers, setMarkers] = useState<MarkerData[]>([])
  const [geocoding, setGeocoding] = useState(false)
  const geocacheRef = useRef<Record<string, [number, number] | null>>({})

  useEffect(() => {
    const appsWithCity = applications.filter((a) => a.city)
    if (appsWithCity.length === 0) {
      setMarkers([])
      return
    }

    const uniqueCities = [...new Set(appsWithCity.map((a) => a.city as string))]
    setGeocoding(true)

    async function run() {
      for (const city of uniqueCities) {
        if (!geocacheRef.current[city]) {
          const coords = await geocodeCity(city)
          geocacheRef.current[city] = coords as [number, number] | null
          await new Promise((r) => setTimeout(r, 100))
        }
      }

      const result: MarkerData[] = []
      for (const app of appsWithCity) {
        if (!app.city) continue
        const coords = geocacheRef.current[app.city]
        if (coords) {
          const jitter = (Math.random() - 0.5) * 0.008
          result.push({ app, position: [coords[0] + jitter, coords[1] + jitter] as [number, number] })
        }
      }
      setMarkers(result)
      setGeocoding(false)
    }

    run()
  }, [applications])

  const appPositions = markers.map((m) => m.position)
  const activeStatuses = [...new Set(applications.map((a) => a.status))]
  const hasOverlay = searchOverlay && ((searchOverlay.companies?.length ?? 0) > 0 || searchOverlay.lat != null)

  return (
    <div className="relative w-full h-full">
      {geocoding && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white text-xs text-gray-600 px-3 py-1.5 rounded-full shadow border border-gray-200">
          Géolocalisation en cours…
        </div>
      )}

      <MapContainer
        center={[46.8, 2.5]}
        zoom={6}
        className="w-full h-full rounded-xl"
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Zoom to search city if overlay active, otherwise fit application bounds */}
        {hasOverlay && searchOverlay.lat != null ? (
          <ZoomToPoint lat={searchOverlay.lat} lng={searchOverlay.lng} />
        ) : (
          appPositions.length > 0 && <FitBounds positions={appPositions} />
        )}

        {/* Application markers */}
        {markers.map(({ app, position }) => (
          <Marker key={app.id} position={position} icon={makeIcon(STATUS_COLORS[app.status as keyof typeof STATUS_COLORS] ?? '#9ca3af')}>
            <Popup maxWidth={220}>
              <div className="text-sm space-y-1">
                <p className="font-semibold text-gray-900 leading-tight">{app.title}</p>
                {app.companyName && <p className="text-gray-600">{app.companyName}</p>}
                <p className="text-gray-500">{app.city}</p>
                <span
                  className="inline-block text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: STATUS_COLORS[app.status as keyof typeof STATUS_COLORS] + '33',
                    color: STATUS_COLORS[app.status as keyof typeof STATUS_COLORS],
                  }}
                >
                  {STATUS_LABELS[app.status as keyof typeof STATUS_LABELS] ?? app.status}
                </span>
                {app.offerUrl && (
                  <div>
                    <a
                      href={app.offerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline text-xs"
                    >
                      Voir l&apos;offre →
                    </a>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Search overlay company markers */}
        {searchOverlay?.companies?.map((company, i) => (
          <Marker
            key={`company-${i}`}
            position={[company.lat, company.lng]}
            icon={makeCompanyIcon()}
          >
            <Popup maxWidth={220}>
              <div className="text-sm space-y-1">
                <p className="font-semibold text-gray-900 leading-tight">{company.name}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Application status legend */}
      {activeStatuses.length > 0 && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-white rounded-xl border border-gray-200 shadow p-3 space-y-1.5">
          {hasOverlay && (
            <div className="flex items-center gap-2 text-xs text-gray-700 pb-1.5 border-b border-gray-100">
              <span
                className="w-3 h-3 rounded-sm flex-shrink-0"
                style={{ background: COMPANY_COLOR }}
              />
              Entreprises
            </div>
          )}
          {activeStatuses.map((s) => (
            <div key={s} className="flex items-center gap-2 text-xs text-gray-700">
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: STATUS_COLORS[s as keyof typeof STATUS_COLORS] ?? '#9ca3af' }}
              />
              {STATUS_LABELS[s as keyof typeof STATUS_LABELS] ?? s}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
