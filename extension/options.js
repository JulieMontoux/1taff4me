const DEFAULT_APP_URL = 'https://1taff4me.vercel.app'

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('app-url')
  const saveBtn = document.getElementById('save-btn')
  const savedEl = document.getElementById('saved')

  chrome.storage.sync.get('appUrl', ({ appUrl }) => {
    input.value = appUrl || DEFAULT_APP_URL
  })

  saveBtn.addEventListener('click', () => {
    const url = input.value.trim().replace(/\/$/, '')
    chrome.storage.sync.set({ appUrl: url }, () => {
      savedEl.style.display = 'inline'
      setTimeout(() => { savedEl.style.display = 'none' }, 2500)
    })
  })
})
