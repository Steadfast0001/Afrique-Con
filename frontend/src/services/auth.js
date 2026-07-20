// Minimal auth service: login, refresh, logout, token helpers

const STORAGE_KEY = 'afriquecon_token'

function saveTokenToStorage(token, remember = true) {
  const storage = remember ? localStorage : sessionStorage
  storage.setItem(STORAGE_KEY, token)
}

function getTokenFromStorage() {
  return localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY)
}

export function getToken() {
  return getTokenFromStorage()
}

export function getTokenPayload() {
  const token = getTokenFromStorage()
  if (!token) return null
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(atob(parts[1]))
    return payload
  } catch (e) {
    return null
  }
}

function getApiBase() {
  const base = import.meta.env.VITE_API_BASE || ''
  if (!base) {
    throw new Error('Auth API base URL is not configured. Set VITE_API_BASE in frontend environment variables.')
  }
  return base
}

export async function login(email, password, remember = true) {
  const base = getApiBase()
  const form = new URLSearchParams()
  form.append('username', email)
  form.append('password', password)

  let resp
  try {
    resp = await fetch(`${base}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: form.toString(),
    })
  } catch (error) {
    throw new Error(
      'Unable to reach auth service. Verify the auth backend is running and VITE_API_BASE is set correctly.'
    )
  }

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}))
    throw new Error(body.detail || 'Invalid credentials')
  }
  const data = await resp.json()
  if (!data.access_token) throw new Error('No token returned')
  saveTokenToStorage(data.access_token, remember)
  if (data.refresh_token) {
    const storage = remember ? localStorage : sessionStorage
    storage.setItem('afriquecon_refresh_token', data.refresh_token)
  }
  return data
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY)
  sessionStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem('afriquecon_refresh_token')
  sessionStorage.removeItem('afriquecon_refresh_token')
  window.location.href = '/login'
}

function getRefreshToken() {
  return localStorage.getItem('afriquecon_refresh_token') || sessionStorage.getItem('afriquecon_refresh_token')
}

export async function refresh() {
  const base = getApiBase()
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  let resp
  try {
    resp = await fetch(`${base}/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    })
  } catch (error) {
    throw new Error(
      'Unable to reach auth service for refresh. Verify the auth backend is running and VITE_API_BASE is configured correctly.'
    )
  }

  if (!resp.ok) throw new Error('Refresh failed')
  const data = await resp.json()
  if (data.access_token) saveTokenToStorage(data.access_token, true)
  return data
}

// Helper: a fetch wrapper that attaches Authorization and retries once after refresh
export async function authFetch(input, init = {}) {
  const token = getTokenFromStorage()
  const headers = new Headers(init.headers || {})
  if (token) headers.set('Authorization', `Bearer ${token}`)
  const base = getApiBase()
  const url = typeof input === 'string' && input.startsWith('/') ? `${base}${input}` : input

  let resp
  try {
    resp = await fetch(url, { ...init, headers, credentials: init.credentials ?? 'same-origin' })
  } catch (error) {
    throw new Error(
      'Unable to reach auth service. Verify the auth backend is running and VITE_API_BASE is set correctly.'
    )
  }

  if (resp.status === 401) {
    // try refresh once
    try {
      await refresh()
      const newToken = getTokenFromStorage()
      if (newToken) headers.set('Authorization', `Bearer ${newToken}`)
      resp = await fetch(url, { ...init, headers, credentials: init.credentials ?? 'same-origin' })
    } catch (e) {
      logout()
      throw e
    }
  }
  return resp
}
