export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export function getToken() {
  return localStorage.getItem('applepoint_token')
}

export function setToken(token) {
  if (token) localStorage.setItem('applepoint_token', token)
  else localStorage.removeItem('applepoint_token')
}

export async function api(path, options = {}) {
  const headers = new Headers(options.headers || {})
  const token = getToken()
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (options.body && !(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }
  const res = await fetch(`${API_URL}${path}`, { ...options, headers })
  let data = null
  try { data = await res.json() } catch { data = {} }
  if (!res.ok) {
    if (res.status === 401) setToken(null)
    throw new Error(data.detail || data.message || 'Request failed')
  }
  return data
}
