import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#111',
    color: '#e0e0e0',
    fontFamily: "'Inter', 'Segoe UI', sans-serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 32px',
    borderBottom: '1px solid #2a2a2a',
  },
  logo: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#7c3aed',
    letterSpacing: '-0.02em',
  },
  logoutBtn: {
    background: 'transparent',
    color: '#888',
    border: '1px solid #333',
    borderRadius: '6px',
    padding: '6px 16px',
    fontSize: '0.85rem',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  main: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 24px',
    textAlign: 'center',
  },
  greeting: {
    fontSize: '2.5rem',
    fontWeight: 700,
    marginBottom: '12px',
    background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  subtitle: {
    color: '#666',
    fontSize: '1.1rem',
    marginBottom: '48px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '16px',
    maxWidth: '720px',
    width: '100%',
  },
  card: {
    background: '#1a1a1a',
    border: '1px solid #2a2a2a',
    borderRadius: '12px',
    padding: '24px',
    textAlign: 'left',
    transition: 'border-color 0.2s',
    cursor: 'default',
  },
  cardIcon: {
    fontSize: '1.5rem',
    marginBottom: '12px',
  },
  cardTitle: {
    fontSize: '1rem',
    fontWeight: 600,
    color: '#ccc',
    marginBottom: '6px',
  },
  cardDesc: {
    fontSize: '0.85rem',
    color: '#555',
    lineHeight: 1.5,
  },
}

const cards = [
  { icon: '\u{1F3A8}', title: 'Play', desc: 'Start a new game of Kalamburya with friends' },
  { icon: '\u{1F4CA}', title: 'Stats', desc: 'View your game history and scores' },
  { icon: '\u{1F465}', title: 'Friends', desc: 'Manage your friends list' },
  { icon: '\u{2699}\u{FE0F}', title: 'Settings', desc: 'Customize your profile and preferences' },
]

export default function HomePage() {
  const { logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <span style={styles.logo}>Kalamburya</span>
        <button
          style={styles.logoutBtn}
          onClick={handleLogout}
          onMouseOver={e => {
            e.currentTarget.style.borderColor = '#555'
            e.currentTarget.style.color = '#bbb'
          }}
          onMouseOut={e => {
            e.currentTarget.style.borderColor = '#333'
            e.currentTarget.style.color = '#888'
          }}
        >
          Sign out
        </button>
      </header>

      <main style={styles.main}>
        <h1 style={styles.greeting}>Welcome back</h1>
        <p style={styles.subtitle}>What would you like to do?</p>

        <div style={styles.grid}>
          {cards.map(c => (
            <div
              key={c.title}
              style={styles.card}
              onMouseOver={e => (e.currentTarget.style.borderColor = '#7c3aed')}
              onMouseOut={e => (e.currentTarget.style.borderColor = '#2a2a2a')}
            >
              <div style={styles.cardIcon}>{c.icon}</div>
              <div style={styles.cardTitle}>{c.title}</div>
              <div style={styles.cardDesc}>{c.desc}</div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
