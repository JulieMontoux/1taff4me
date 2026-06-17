'use client'

import { useState, useEffect } from 'react'

const CV_KEY = '1taff4me_cv'

function scoreColor(score) {
  if (score >= 70) return { ring: '#16a34a', bg: '#dcfce7', text: '#15803d' }
  if (score >= 40) return { ring: '#d97706', bg: '#fef3c7', text: '#b45309' }
  return { ring: '#dc2626', bg: '#fee2e2', text: '#b91c1c' }
}

function ScoreGauge({ score }) {
  const { ring, bg, text } = scoreColor(score)
  const r = 36
  const circ = 2 * Math.PI * r
  const dash = (score / 100) * circ
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill={bg} stroke="#e5e7eb" strokeWidth="8" />
        <circle
          cx="48" cy="48" r={r}
          fill="none"
          stroke={ring}
          strokeWidth="8"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 48 48)"
        />
        <text x="48" y="53" textAnchor="middle" fontSize="22" fontWeight="700" fill={text}>
          {score}
        </text>
      </svg>
      <span className="text-xs font-medium" style={{ color: text }}>/100</span>
    </div>
  )
}

function Section({ title, items, color }) {
  if (!items?.length) return null
  const styles = {
    green: 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-green-700 dark:text-green-400',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-400',
  }
  return (
    <div className={`border rounded-lg p-3 ${styles[color]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide mb-2 opacity-70">{title}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-sm flex gap-2">
            <span className="mt-0.5 flex-shrink-0">
              {color === 'green' ? '✓' : color === 'red' ? '✗' : color === 'blue' ? '→' : '·'}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

export function ScoreModal({ open, onClose, application }) {
  const [cvText, setCvText] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!open) return
    try {
      const saved = localStorage.getItem(CV_KEY)
      if (saved) setCvText(saved)
    } catch {}
    setResult(null)
    setError(null)
  }, [open])

  function handleCvChange(e) {
    const val = e.target.value
    setCvText(val)
    try { localStorage.setItem(CV_KEY, val) } catch {}
  }

  async function handleAnalyze() {
    if (!cvText.trim() || cvText.trim().length < 50) {
      setError('CV trop court (50 caractères min).')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const res = await fetch('/api/score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cvText: cvText.trim(),
          jobTitle: application.title,
          companyName: application.companyName,
          city: application.city || undefined,
          contractType: application.contractType || undefined,
          notes: application.notes || undefined,
          offerDescription: application.offerDescription || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Erreur lors de l\'analyse')
        return
      }
      setResult(data)
    } catch {
      setError('Erreur réseau')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Score IA</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {application.title} · {application.companyName}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-lg">✕</button>
        </div>

        <div className="p-6 space-y-5">
          {/* CV input */}
          {!result && (
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                Ton CV{' '}
                <span className="text-gray-400 dark:text-gray-500 font-normal">(texte brut — sauvegardé localement)</span>
              </label>
              <textarea
                value={cvText}
                onChange={handleCvChange}
                rows={8}
                placeholder="Colle ici le texte de ton CV…"
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-700 rounded-lg outline-none bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:focus:ring-brand-900/30 resize-none"
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 text-right">{cvText.length}/20000</p>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Result */}
          {result && (
            <div className="space-y-4">
              <div className="flex items-center gap-6 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                <ScoreGauge score={result.score} />
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{result.verdict}</p>
                  {result.keywords?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {result.keywords.map((kw, i) => (
                        <span key={i} className="text-xs px-2 py-0.5 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded">
                          {kw}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <Section title="Points forts" items={result.strengths} color="green" />
              <Section title="Lacunes" items={result.gaps} color="red" />
              <Section title="Conseils" items={result.tips} color="blue" />
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {result ? (
              <>
                <button
                  onClick={() => { setResult(null); setError(null) }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Modifier le CV
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 transition-colors"
                >
                  Fermer
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAnalyze}
                  disabled={loading || cvText.trim().length < 50}
                  className="flex-1 px-4 py-2.5 bg-brand-600 text-white rounded-lg text-sm font-semibold hover:bg-brand-700 disabled:opacity-40 transition-colors"
                >
                  {loading ? 'Analyse en cours…' : 'Analyser'}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
