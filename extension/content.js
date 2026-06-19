/* Content script — extracts job data + detects apply button clicks */

function text(selector, root = document) {
  return root.querySelector(selector)?.textContent?.trim() || null
}

function attr(selector, attribute, root = document) {
  return root.querySelector(selector)?.getAttribute(attribute)?.trim() || null
}

function meta(property) {
  return (
    attr(`meta[property="${property}"]`, 'content') ||
    attr(`meta[name="${property}"]`, 'content') ||
    null
  )
}

function extractJobData() {
  const host = window.location.hostname

  let title = null
  let companyName = null
  let city = null
  let contractType = null
  let platform = null

  // Welcome to the Jungle
  if (host.includes('welcometothejungle.com')) {
    platform = 'Welcome to the Jungle'
    title =
      text('[data-testid="job-header-title"]') ||
      text('h1.sc-6i2fyx-0') ||
      text('h1')
    companyName =
      attr('[data-testid="job-header-logo"] img', 'alt') ||
      text('[data-testid="job-header-organization-name"]') ||
      text('.sc-jl06ct-1')
    city =
      text('[data-testid="job-summary-location"]') ||
      text('[data-testid="job-header-location"]')
    contractType = text('[data-testid="job-summary-contract-type"]')
  }

  // LinkedIn
  else if (host.includes('linkedin.com')) {
    platform = 'LinkedIn'
    title =
      text('h1.job-details-jobs-unified-top-card__job-title') ||
      text('h1[class*="job-title"]') ||
      text('.job-details-jobs-unified-top-card__job-title')
    companyName =
      text('.job-details-jobs-unified-top-card__company-name a') ||
      text('.job-details-jobs-unified-top-card__company-name')
    city = text('.job-details-jobs-unified-top-card__bullet')
  }

  // Indeed
  else if (host.includes('indeed.com') || host.includes('indeed.fr')) {
    platform = 'Indeed'
    title =
      text('h1[data-testid="jobsearch-JobInfoHeader-title"]') ||
      text('h1.jobsearch-JobInfoHeader-title')
    companyName =
      text('[data-testid="inlineHeader-companyName"] a') ||
      text('[data-testid="inlineHeader-companyName"] span') ||
      text('[data-testid="inlineHeader-companyName"]')
    city =
      text('[data-testid="job-location"]') ||
      text('[data-testid="inlineHeader-companyLocation"]')
  }

  // HelloWork
  else if (host.includes('hellowork.com')) {
    platform = 'HelloWork'
    title = text('h1[class*="title"]') || text('h1')
    companyName = text('[class*="company-name"]') || text('[itemprop="name"]')
    city = text('[class*="location"]') || text('[itemprop="addressLocality"]')
  }

  // APEC
  else if (host.includes('apec.fr')) {
    platform = 'APEC'
    title = text('h1.job-offer-title') || text('h1')
    companyName = text('.company-title') || text('[class*="company"]')
    city = text('.job-offer-location') || text('[class*="location"]')
  }

  // Cadremploi
  else if (host.includes('cadremploi.fr')) {
    platform = 'Cadremploi'
    title = text('h1.job-title') || text('h1')
    companyName = text('.company-name') || text('[class*="company"]')
    city = text('.job-location') || text('[class*="location"]')
  }

  // Generic fallback
  if (!title) {
    title =
      text('[itemprop="title"]') ||
      text('[itemprop="name"]') ||
      meta('og:title') ||
      document.title.split('|')[0].split('-')[0].trim() ||
      null
  }
  if (!companyName) {
    companyName =
      text('[itemprop="hiringOrganization"] [itemprop="name"]') ||
      meta('og:site_name') ||
      null
  }
  if (!city) {
    city =
      text('[itemprop="jobLocation"] [itemprop="addressLocality"]') ||
      meta('og:locality') ||
      null
  }

  return { title, companyName, city, contractType, platform, url: window.location.href }
}

// ─── Apply button detection ───────────────────────────────────────────────────

const APPLY_SELECTORS = {
  'linkedin.com': [
    '.jobs-apply-button',
    'button[data-control-name*="apply"]',
    'button[aria-label*="Postuler"]',
    'button[aria-label*="Apply"]',
  ],
  'indeed': [
    '#indeedApplyButton',
    'button#applyButton',
    'a#applyButton',
    'button[data-testid="applyButton"]',
    'a[data-testid="applyButton"]',
  ],
  'welcometothejungle.com': [
    'a[href*="/apply"]',
    'button[data-testid*="apply"]',
    'a[data-testid*="apply"]',
  ],
  'hellowork.com': [
    '.btn-apply',
    'a[class*="apply"]',
    'button[class*="apply"]',
    'a[data-testid*="apply"]',
  ],
  'apec.fr': [
    '.btn-postuler',
    'a[class*="postuler"]',
    'button[class*="postuler"]',
    'a[href*="postuler"]',
  ],
  'francetravail.fr': [
    'a[class*="postuler"]',
    'button[class*="postuler"]',
    '.postuler-btn',
  ],
  'cadremploi.fr': [
    '.apply-btn',
    'a[class*="apply"]',
    'button[class*="apply"]',
  ],
}

function getApplySelectors() {
  const host = window.location.hostname
  for (const [key, selectors] of Object.entries(APPLY_SELECTORS)) {
    if (host.includes(key)) return selectors
  }
  return []
}

// ─── Toast overlay ────────────────────────────────────────────────────────────

let toastEl = null
let toastTimeout = null

function removeToast() {
  if (toastTimeout) clearTimeout(toastTimeout)
  if (toastEl) {
    toastEl.style.opacity = '0'
    toastEl.style.transform = 'translateY(12px)'
    setTimeout(() => { toastEl?.remove(); toastEl = null }, 300)
  }
}

function showToast(jobData) {
  removeToast()

  const toast = document.createElement('div')
  toast.id = '__1taff4me_toast'

  const title = jobData.title ? `<strong>${jobData.title}</strong>` : 'ce poste'
  const company = jobData.companyName ? ` chez ${jobData.companyName}` : ''

  toast.innerHTML = `
    <div style="display:flex;align-items:flex-start;gap:12px;">
      <span style="font-size:20px;flex-shrink:0;">🎯</span>
      <div style="flex:1;min-width:0;">
        <p style="margin:0 0 4px;font-weight:600;font-size:13px;color:#111827;">Candidature détectée !</p>
        <p style="margin:0 0 10px;font-size:12px;color:#6b7280;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
          ${title}${company}
        </p>
        <div style="display:flex;gap:8px;">
          <button id="__1taff4me_confirm" style="padding:6px 14px;background:#7c3aed;color:white;border:none;border-radius:6px;font-size:12px;font-weight:600;cursor:pointer;">
            Enregistrer ✓
          </button>
          <button id="__1taff4me_cancel" style="padding:6px 10px;background:none;border:1px solid #d1d5db;border-radius:6px;font-size:12px;color:#6b7280;cursor:pointer;">
            Ignorer
          </button>
        </div>
      </div>
    </div>
    <div style="position:absolute;bottom:0;left:0;height:3px;background:#7c3aed;border-radius:0 0 0 12px;animation:__1taff4me_progress 8s linear forwards;" id="__1taff4me_bar"></div>
  `

  Object.assign(toast.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    zIndex: '2147483647',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '14px 16px 14px 14px',
    boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    width: '280px',
    opacity: '0',
    transform: 'translateY(12px)',
    transition: 'opacity 0.25s, transform 0.25s',
    overflow: 'hidden',
  })

  // Inject progress bar animation
  if (!document.getElementById('__1taff4me_style')) {
    const style = document.createElement('style')
    style.id = '__1taff4me_style'
    style.textContent = `
      @keyframes __1taff4me_progress {
        from { width: 100%; }
        to { width: 0%; }
      }
    `
    document.head.appendChild(style)
  }

  document.body.appendChild(toast)
  toastEl = toast

  requestAnimationFrame(() => {
    toast.style.opacity = '1'
    toast.style.transform = 'translateY(0)'
  })

  document.getElementById('__1taff4me_confirm')?.addEventListener('click', () => {
    saveAndClose(jobData)
  })

  document.getElementById('__1taff4me_cancel')?.addEventListener('click', removeToast)

  // Auto-save after 8s
  toastTimeout = setTimeout(() => saveAndClose(jobData), 8000)
}

function saveAndClose(jobData) {
  if (!toastEl) return

  const confirm = document.getElementById('__1taff4me_confirm')
  if (confirm) {
    confirm.textContent = 'Enregistrement…'
    confirm.disabled = true
  }

  chrome.runtime.sendMessage({ type: 'SAVE_APPLICATION', data: jobData }, (result) => {
    if (!toastEl) return
    if (result?.ok) {
      toastEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:18px;">✅</span>
          <p style="margin:0;font-size:13px;font-weight:600;color:#111827;">Candidature enregistrée !</p>
        </div>
      `
    } else if (result?.error === 'no_token') {
      toastEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:18px;">⚠️</span>
          <div>
            <p style="margin:0 0 4px;font-size:13px;font-weight:600;color:#111827;">Token API manquant</p>
            <p style="margin:0;font-size:11px;color:#6b7280;">Configure-le dans les options de l'extension.</p>
          </div>
        </div>
      `
    } else {
      toastEl.innerHTML = `
        <div style="display:flex;align-items:center;gap:10px;">
          <span style="font-size:18px;">❌</span>
          <p style="margin:0;font-size:13px;color:#dc2626;">Erreur lors de l'enregistrement.</p>
        </div>
      `
    }
    setTimeout(removeToast, 3000)
  })
}

// ─── Apply button watcher ─────────────────────────────────────────────────────

let lastApplyClickUrl = null

function watchApplyButtons() {
  const selectors = getApplySelectors()
  if (selectors.length === 0) return

  function attachListeners() {
    selectors.forEach((selector) => {
      document.querySelectorAll(selector).forEach((btn) => {
        if (btn.dataset.__1taff4meWatched) return
        btn.dataset.__1taff4meWatched = '1'

        btn.addEventListener('click', () => {
          const currentUrl = window.location.href
          // Debounce: don't show twice for same URL within 10s
          if (lastApplyClickUrl === currentUrl) return
          lastApplyClickUrl = currentUrl
          setTimeout(() => { if (lastApplyClickUrl === currentUrl) lastApplyClickUrl = null }, 10000)

          const jobData = extractJobData()
          if (jobData.title || jobData.companyName) {
            showToast(jobData)
          }
        }, { once: false })
      })
    })
  }

  attachListeners()

  // Re-scan on DOM changes (SPA navigation)
  const observer = new MutationObserver(() => attachListeners())
  observer.observe(document.body, { childList: true, subtree: true })
}

watchApplyButtons()

// ─── Message listener (popup → content) ──────────────────────────────────────

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_JOB_DATA') {
    sendResponse(extractJobData())
  }
})
