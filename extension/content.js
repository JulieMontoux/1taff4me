/* Content script — runs on job listing pages, extracts structured data */

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

  // Welcome to the Jungle
  if (host.includes('welcometothejungle.com')) {
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
    title = text('h1[class*="title"]') || text('h1')
    companyName = text('[class*="company-name"]') || text('[itemprop="name"]')
    city = text('[class*="location"]') || text('[itemprop="addressLocality"]')
  }

  // Cadremploi
  else if (host.includes('cadremploi.fr')) {
    title = text('h1.job-title') || text('h1')
    companyName = text('.company-name') || text('[class*="company"]')
    city = text('.job-location') || text('[class*="location"]')
  }

  // Generic fallback (schema.org + OpenGraph)
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

  return { title, companyName, city, contractType, url: window.location.href }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === 'GET_JOB_DATA') {
    sendResponse(extractJobData())
  }
})
