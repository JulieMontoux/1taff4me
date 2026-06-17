const DEFAULT_APP_URL = 'https://1taff4me.vercel.app'

async function getAppUrl() {
  return new Promise((resolve) => {
    chrome.storage.sync.get('appUrl', ({ appUrl }) => {
      resolve(appUrl || DEFAULT_APP_URL)
    })
  })
}

function showError(msg) {
  const el = document.getElementById('error')
  el.textContent = msg
  el.style.display = 'block'
}

function setSiteBadge(hostname) {
  const el = document.getElementById('site-badge')
  const known = [
    'welcometothejungle.com',
    'linkedin.com',
    'indeed.com',
    'indeed.fr',
    'hellowork.com',
    'cadremploi.fr',
    'apec.fr',
    'francetravail.fr',
  ]
  const match = known.find((s) => hostname.includes(s))
  if (match) {
    el.textContent = match.replace('www.', '')
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const addBtn = document.getElementById('add-btn')
  const jobInfo = document.getElementById('job-info')
  const statusEl = document.getElementById('status')

  let currentUrl = null
  let jobData = null

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    currentUrl = tab.url

    const hostname = new URL(currentUrl).hostname
    setSiteBadge(hostname)

    // Try to get structured data from content script
    try {
      jobData = await chrome.tabs.sendMessage(tab.id, { type: 'GET_JOB_DATA' })
    } catch {
      // Content script not injected (not a job page) — that's fine
    }

    if (jobData?.title || jobData?.companyName) {
      document.getElementById('job-title').textContent = jobData.title || '—'
      document.getElementById('job-company').textContent = [
        jobData.companyName,
        jobData.city,
        jobData.contractType,
      ]
        .filter(Boolean)
        .join(' · ')
      jobInfo.style.display = 'block'
    } else {
      statusEl.innerHTML = '<span class="badge badge-warn"><span class="dot"></span>Page non reconnue — l\'URL sera importée</span>'
    }

    addBtn.disabled = false
  } catch (err) {
    showError('Impossible de lire l\'onglet actif.')
  }

  addBtn.addEventListener('click', async () => {
    if (!currentUrl) return
    try {
      const appUrl = await getAppUrl()
      const params = new URLSearchParams({ import: currentUrl })
      await chrome.tabs.create({ url: `${appUrl}/dashboard?${params}` })
      window.close()
    } catch {
      showError('Erreur lors de l\'ouverture de l\'app.')
    }
  })

  document.getElementById('options-btn').addEventListener('click', () => {
    chrome.runtime.openOptionsPage()
  })
})
