const DEFAULT_APP_URL = 'https://1taff4me.vercel.app'

async function getConfig() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['appUrl', 'apiToken'], ({ appUrl, apiToken }) => {
      resolve({ appUrl: appUrl || DEFAULT_APP_URL, apiToken: apiToken || null })
    })
  })
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'SAVE_APPLICATION') {
    saveApplication(message.data).then(sendResponse)
    return true // async response
  }
})

async function saveApplication(jobData) {
  const { appUrl, apiToken } = await getConfig()

  if (!apiToken) {
    return { ok: false, error: 'no_token' }
  }

  try {
    const res = await fetch(`${appUrl}/api/applications`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        title: jobData.title || 'Poste non renseigné',
        companyName: jobData.companyName || 'Entreprise non renseignée',
        offerUrl: jobData.url || null,
        city: jobData.city || null,
        contractType: jobData.contractType || 'CDI',
        status: 'applied',
        tags: [jobData.platform || 'extension'],
      }),
    })

    if (!res.ok) return { ok: false, error: `http_${res.status}` }
    return { ok: true }
  } catch (err) {
    return { ok: false, error: 'network' }
  }
}
