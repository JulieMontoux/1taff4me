'use client'

import { useState, useEffect } from 'react'

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)))
}

export function PushToggle() {
  const [supported, setSupported] = useState(false)
  const [permission, setPermission] = useState('default')
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [testSent, setTestSent] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setLoading(false)
      return
    }
    setSupported(true)
    setPermission(Notification.permission)
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function subscribe() {
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
    if (!publicKey) {
      setError('Clé VAPID manquante — contactez l\'administrateur.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const perm = await Notification.requestPermission()
      setPermission(perm)
      if (perm !== 'granted') {
        setError('Permission refusée par le navigateur.')
        return
      }
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      })
      const { endpoint, keys } = sub.toJSON()
      const res = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpoint, keys }),
      })
      if (!res.ok) throw new Error()
      setSubscribed(true)
    } catch {
      setError('Erreur lors de l\'activation des notifications.')
    } finally {
      setLoading(false)
    }
  }

  async function unsubscribe() {
    setLoading(true)
    setError(null)
    try {
      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        const { endpoint } = sub.toJSON()
        await sub.unsubscribe()
        await fetch('/api/push/subscribe', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint }),
        })
      }
      setSubscribed(false)
    } catch {
      setError('Erreur lors de la désactivation.')
    } finally {
      setLoading(false)
    }
  }

  async function sendTest() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/push/test', { method: 'POST' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error)
      }
      setTestSent(true)
      setTimeout(() => setTestSent(false), 3000)
    } catch (err) {
      setError(err.message || 'Erreur lors de l\'envoi du test.')
    } finally {
      setLoading(false)
    }
  }

  if (!supported) {
    return (
      <p className="text-sm text-gray-400 dark:text-gray-500">
        Notifications push non supportées sur ce navigateur.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Notifications push</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
            {subscribed
              ? 'Activées sur cet appareil'
              : 'Recevez vos rappels dans le navigateur'}
          </p>
        </div>
        <button
          type="button"
          onClick={subscribed ? unsubscribe : subscribe}
          disabled={loading || permission === 'denied'}
          className={`relative w-11 h-6 rounded-full transition-colors disabled:opacity-40 ${
            subscribed ? 'bg-brand-600' : 'bg-gray-200 dark:bg-gray-700'
          }`}
          aria-label={subscribed ? 'Désactiver les notifications' : 'Activer les notifications'}
        >
          <span
            className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
              subscribed ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {permission === 'denied' && (
        <p className="text-xs text-orange-600 dark:text-orange-400">
          Notifications bloquées dans les paramètres du navigateur.
        </p>
      )}

      {subscribed && (
        <button
          type="button"
          onClick={sendTest}
          disabled={loading}
          className="text-xs text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-40 transition-opacity"
        >
          {testSent ? '✓ Notification envoyée !' : 'Tester une notification'}
        </button>
      )}

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
}
