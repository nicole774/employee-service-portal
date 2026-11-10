const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api'

export async function api(path, options = {}) {
  const token = localStorage.getItem('token')

  const response = await fetch(API_URL + path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  })

  if (response.status === 204) return null

  const data = await response.json()
  if (!response.ok) {
    const message = data.details
      ? data.details.map((detail) => detail.message).join('. ')
      : data.error
    throw new Error(message || 'Erreur ' + response.status)
  }
  return data
}