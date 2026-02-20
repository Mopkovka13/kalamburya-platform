import { createContext, useContext, useEffect, useState } from 'react'
import authApi from '../api/authApi'

interface AuthContextValue {
  token: string | null
  loading: boolean
  login: (t: string) => void
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    authApi.post<{ accessToken: string }>('/auth/refresh')
      .then(res => setToken(res.data.accessToken))
      .catch(() => setToken(null))
      .finally(() => setLoading(false))
  }, [])

  const login = (t: string) => setToken(t)

  const logout = async () => {
    await authApi.post('/auth/logout')
    setToken(null)
  }

  return (
    <AuthContext.Provider value={{ token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
