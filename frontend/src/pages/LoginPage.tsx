import CarrotBackground from '../components/CarrotBackground'

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#1a1a1a',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'none',
    overflow: 'hidden',
  },
  card: {
    background: 'rgba(42, 42, 42, 0.92)',
    borderRadius: '12px',
    padding: '48px 40px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '24px',
    minWidth: '320px',
    position: 'relative',
    zIndex: 1,
    backdropFilter: 'blur(8px)',
    border: '1px solid rgba(255, 140, 50, 0.15)',
  },
  title: {
    fontSize: '1.5rem',
    fontWeight: 600,
    color: '#e0e0e0',
    letterSpacing: '0.02em',
  },
  button: {
    background: '#2d6a4f',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    padding: '12px 32px',
    fontSize: '1rem',
    cursor: 'none',
    width: '100%',
    transition: 'background 0.2s',
  },
}

export default function LoginPage() {
  const handleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/oauth2/authorization/google`
  }

  return (
    <div style={styles.page}>
      <CarrotBackground />
      <div style={styles.card}>
        <h1 style={styles.title}>Kalamburya</h1>
        <button
          style={styles.button}
          onClick={handleLogin}
          onMouseOver={e => (e.currentTarget.style.background = '#1f4f39')}
          onMouseOut={e => (e.currentTarget.style.background = '#2d6a4f')}
        >
          Sign in with Google
        </button>
      </div>
    </div>
  )
}
