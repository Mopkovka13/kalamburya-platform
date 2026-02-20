import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export default function ProtectedRoute() {
  const { token, loading } = useAuth()

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ color: '#888', fontSize: '1rem' }}>Loading…</div>
      </div>
    )
  }

  if (!token) return <Navigate to="/login" replace />
  return <Outlet />
}
