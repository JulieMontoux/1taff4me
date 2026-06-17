self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {}
  const title = data.title || '1taff4me'
  const options = {
    body: data.body || '',
    icon: '/icon.svg',
    badge: '/icon.svg',
    data: { url: data.url || '/dashboard' },
    actions: [{ action: 'open', title: 'Voir' }],
    requireInteraction: false,
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/dashboard'
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((list) => {
        for (const client of list) {
          if (client.url.includes(url) && 'focus' in client) return client.focus()
        }
        if (clients.openWindow) return clients.openWindow(url)
      })
  )
})
