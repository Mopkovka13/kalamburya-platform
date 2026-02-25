import { useState, useCallback, useEffect } from 'react'
import CarrotBackground from '../components/CarrotBackground'

const MILESTONES = [128, 256, 512, 1024]

export default function LoginPage() {
  const [eaten, setEaten] = useState(0)
  const [easterEgg, setEasterEgg] = useState(false)
  const [closing, setClosing] = useState(false)
  const [curtainProgress, setCurtainProgress] = useState(0) // 0..1

  const currentMilestone = MILESTONES.find(m => eaten < m) ?? MILESTONES[MILESTONES.length - 1]
  const unlocked = eaten >= MILESTONES[0]

  const handleEat = useCallback(() => {
    setEaten(prev => {
      const next = prev + 1
      if (next >= 1024 && prev < 1024) {
        setEasterEgg(true)
      }
      return next
    })
  }, [])

  // Easter egg curtain open animation
  useEffect(() => {
    if (!easterEgg || closing) return
    let raf: number
    const start = performance.now()
    const duration = 3000
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1)
      setCurtainProgress(t)
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [easterEgg, closing])

  // Easter egg curtain close animation
  useEffect(() => {
    if (!closing) return
    let raf: number
    const startVal = curtainProgress
    const start = performance.now()
    const duration = 3000
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1)
      const val = startVal * (1 - t)
      setCurtainProgress(val)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setEasterEgg(false)
        setClosing(false)
        setEaten(0)
        setCurtainProgress(0)
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [closing])

  // Close easter egg on any input
  useEffect(() => {
    if (!easterEgg || closing) return
    const dismiss = () => setClosing(true)
    window.addEventListener('keydown', dismiss)
    window.addEventListener('mousedown', dismiss)
    window.addEventListener('touchstart', dismiss)
    return () => {
      window.removeEventListener('keydown', dismiss)
      window.removeEventListener('mousedown', dismiss)
      window.removeEventListener('touchstart', dismiss)
    }
  }, [easterEgg, closing])

  const handleLogin = () => {
    if (!unlocked) return
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:8081'}/oauth2/authorization/google`
  }

  // Progress bar width within current milestone segment
  const prevMilestone = MILESTONES[MILESTONES.indexOf(currentMilestone) - 1] ?? 0
  const segmentProgress = (eaten - prevMilestone) / (currentMilestone - prevMilestone)

  return (
    <div style={styles.page}>
      <CarrotBackground onEat={handleEat} />

      {/* Counter */}
      <div style={styles.counterContainer}>
        <div style={styles.counterIcon}>🥕</div>
        <div style={styles.counterText}>
          {eaten} / {currentMilestone}
        </div>
        <div style={styles.progressBarBg}>
          <div
            style={{
              ...styles.progressBarFill,
              width: `${Math.min(segmentProgress, 1) * 100}%`,
            }}
          />
        </div>
      </div>

      {/* Card */}
      <div style={styles.card}>
        <h1 style={styles.title}>Kalamburya</h1>
        <button
          style={{
            ...styles.button,
            ...(unlocked ? {} : styles.buttonDisabled),
          }}
          onClick={handleLogin}
          disabled={!unlocked}
          onMouseOver={e => {
            if (unlocked) e.currentTarget.style.background = '#1f4f39'
          }}
          onMouseOut={e => {
            if (unlocked) e.currentTarget.style.background = '#2d6a4f'
          }}
        >
          {unlocked ? 'Sign in with Google' : `Eat ${MILESTONES[0]} carrots to unlock 🔒`}
        </button>
      </div>

      {/* Easter egg curtain */}
      {easterEgg && (
        <div
          style={{
            ...styles.curtain,
            height: `${curtainProgress * 100}%`,
          }}
        >
          {curtainProgress > 0.5 && (
            <div
              style={{
                ...styles.easterEggContent,
                opacity: (curtainProgress - 0.5) * 2,
              }}
            >
              <div style={styles.easterEggEmoji}>🐰🥕</div>
              <div style={styles.easterEggTitle}>You are truly dedicated</div>
              <div style={styles.easterEggSub}>1024 carrots. Respect.</div>
              {/* Placeholder image — replace later */}
              <img
                src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='200' fill='none'%3E%3Crect width='300' height='200' rx='16' fill='%23222'/%3E%3Ctext x='150' y='100' text-anchor='middle' dominant-baseline='central' font-size='64'%3E%F0%9F%90%B0%3C/text%3E%3C/svg%3E"
                alt="Easter egg"
                style={styles.easterEggImage}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

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
    transition: 'background 0.2s, opacity 0.3s',
  },
  buttonDisabled: {
    background: '#3a3a3a',
    color: '#666',
    opacity: 0.7,
  },
  // Counter
  counterContainer: {
    position: 'fixed',
    top: '24px',
    left: '24px',
    zIndex: 20,
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    background: 'rgba(30, 30, 30, 0.85)',
    backdropFilter: 'blur(6px)',
    borderRadius: '12px',
    padding: '10px 18px',
    border: '1px solid rgba(255, 140, 50, 0.25)',
    minWidth: '160px',
    flexWrap: 'wrap',
  },
  counterIcon: {
    fontSize: '28px',
    lineHeight: 1,
  },
  counterText: {
    fontSize: '1.1rem',
    fontWeight: 700,
    color: '#f0a040',
    fontFamily: 'monospace',
    letterSpacing: '0.05em',
  },
  progressBarBg: {
    width: '100%',
    height: '4px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '2px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #f0a040, #ff6a00)',
    borderRadius: '2px',
    transition: 'width 0.15s ease-out',
  },
  // Easter egg
  curtain: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    background: '#000',
    zIndex: 100,
    overflow: 'hidden',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  easterEggContent: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '20px',
    transition: 'opacity 0.5s',
  },
  easterEggEmoji: {
    fontSize: '72px',
  },
  easterEggTitle: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#f0a040',
    textAlign: 'center',
  },
  easterEggSub: {
    fontSize: '1.1rem',
    color: '#888',
    textAlign: 'center',
  },
  easterEggImage: {
    marginTop: '16px',
    borderRadius: '16px',
    maxWidth: '300px',
  },
}
