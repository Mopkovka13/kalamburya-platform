import { createContext, useContext, useEffect, useRef, useState } from 'react'
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
  const authStarted = useRef(false)

  useEffect(() => {
    if (authStarted.current) return
    authStarted.current = true

    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')

    const authenticate = code
      ? authApi.post<{ accessToken: string }>('/auth/token', null, { params: { code } })
      : authApi.post<{ accessToken: string }>('/auth/refresh')

    authenticate
      .then(res => {
        setToken(res.data.accessToken)
        if (code) {
          window.history.replaceState({}, '', window.location.pathname)
        }
      })
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
