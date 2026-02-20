import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#1a1a1a',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    background: '#2a2a2a',
    borderRadius: '12px',
    padding: '48px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    minWidth: '320px',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#e0e0e0',
  },
  sub: {
    color: '#888',
    fontSize: '0.9rem',
  },
  button: {
    background: '#3a3a3a',
    color: '#bbb',
    border: '1px solid #555',
    borderRadius: '8px',
    padding: '10px 24px',
    fontSize: '0.9rem',
    cursor: 'pointer',
    width: '100%',
    transition: 'background 0.2s',
  },
}

export default function HomePage() {
  const { login, logout } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    if (t) {
      login(t)
      window.history.replaceState({}, '', '/home')
    }
  }, [login])

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <h1 style={styles.title}>Welcome</h1>
        <p style={styles.sub}>You are signed in.</p>
        <button
          style={styles.button}
          onClick={handleLogout}
          onMouseOver={e => (e.currentTarget.style.background = '#4a4a4a')}
          onMouseOut={e => (e.currentTarget.style.background = '#3a3a3a')}
        >
          Logout
        </button>
      </div>
    </div>
  )
}
