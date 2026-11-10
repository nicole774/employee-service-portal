import { createContext, useContext, useEffect, useState } from 'react'
import { api } from './api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(() => Boolean(localStorage.getItem('token')))

  // Au chargement : si un token est gardé, on récupère l'utilisateur
  useEffect(() => {
    if (!localStorage.getItem('token')) return
    api('/auth/me')
      .then(setUser)
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setLoading(false))
  }, [])

  async function login(email, password) {
    const { token } = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    })
    localStorage.setItem('token', token)
    setUser(await api('/auth/me'))
  }

  function logout() {
    localStorage.removeItem('token')
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext)
}
