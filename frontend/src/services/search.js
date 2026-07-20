import { authFetch } from './auth'

async function search({ origin, destination, date }) {
  const params = new URLSearchParams()
  if (origin) params.set('origin', origin)
  if (destination) params.set('destination', destination)
  if (date) params.set('date', date)

  const base = import.meta.env.VITE_API_BASE || ''
  const url = `${base}/api/search?${params.toString()}`

  try {
    const resp = await fetch(url, { method: 'GET', credentials: 'same-origin' })
    if (!resp.ok) {
      const body = await resp.text().catch(() => '')
      throw new Error(body || `Search request failed: ${resp.status}`)
    }
    return resp.json()
  } catch (e) {
    throw new Error(e.message || 'Search failed')
  }
}

export default { search }
