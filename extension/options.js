const DEFAULT_APP_URL = 'https://1taff4me.vercel.app'

document.addEventListener('DOMContentLoaded', () => {
  const appUrlInput = document.getElementById('app-url')
  const apiTokenInput = document.getElementById('api-token')
  const toggleBtn = document.getElementById('toggle-token')
  const saveBtn = document.getElementById('save-btn')
  const savedEl = document.getElementById('saved')
  const openSettingsLink = document.getElementById('open-settings')

  chrome.storage.sync.get(['appUrl', 'apiToken'], ({ appUrl, apiToken }) => {
    appUrlInput.value = appUrl || DEFAULT_APP_URL
    if (apiToken) apiTokenInput.value = apiToken
  })

  toggleBtn.addEventListener('click', () => {
    const isPassword = apiTokenInput.type === 'password'
    apiTokenInput.type = isPassword ? 'text' : 'password'
    toggleBtn.textContent = isPassword ? 'Cacher' : 'Voir'
  })

  openSettingsLink.addEventListener('click', (e) => {
    e.preventDefault()
    chrome.storage.sync.get('appUrl', ({ appUrl }) => {
      chrome.tabs.create({ url: `${appUrl || DEFAULT_APP_URL}/settings#integrations` })
    })
  })

  saveBtn.addEventListener('click', () => {
    const url = appUrlInput.value.trim().replace(/\/$/, '')
    const token = apiTokenInput.value.trim()
    chrome.storage.sync.set({ appUrl: url, apiToken: token }, () => {
      savedEl.style.display = 'inline'
      setTimeout(() => { savedEl.style.display = 'none' }, 2500)
    })
  })
})
