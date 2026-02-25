import { useEffect, useRef, useCallback } from 'react'

interface Carrot {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  rotation: number
  rotationSpeed: number
  eaten: boolean
  eatenProgress: number
  eatStartX: number
  eatStartY: number
  eatTargetX: number
  eatTargetY: number
}

interface Crumb {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  size: number
  rotation: number
  rotationSpeed: number
}

const CARROT_COUNT = 60
const CONNECTION_DISTANCE = 180
const EAT_RADIUS = 60
const RABBIT_SIZE = 56
const CARROT_FONT_SIZE = 44
const SPEED_RANGE = 0.5
const EAT_DURATION = 30

// Pre-render an emoji to an offscreen canvas for fast drawImage
function prerenderEmoji(emoji: string, size: number): HTMLCanvasElement {
  const pad = Math.ceil(size * 0.3)
  const dim = size + pad * 2
  const c = document.createElement('canvas')
  c.width = dim
  c.height = dim
  const ctx = c.getContext('2d')!
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.font = `${size}px serif`
  ctx.fillText(emoji, dim / 2, dim / 2)
  return c
}

function createCarrot(w: number, h: number): Carrot {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    vx: (Math.random() - 0.5) * SPEED_RANGE * 2,
    vy: (Math.random() - 0.5) * SPEED_RANGE * 2,
    size: CARROT_FONT_SIZE,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.02,
    eaten: false,
    eatenProgress: 0,
    eatStartX: 0,
    eatStartY: 0,
    eatTargetX: 0,
    eatTargetY: 0,
  }
}

export default function CarrotBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const mouseRef = useRef({ x: -200, y: -200 })
  const carrotsRef = useRef<Carrot[]>([])
  const crumbsRef = useRef<Crumb[]>([])
  const animRef = useRef<number>(0)
  const rabbitEatingRef = useRef(0)

  // Cached emoji sprites
  const carrotSpriteRef = useRef<HTMLCanvasElement | null>(null)
  const rabbitSpriteRef = useRef<HTMLCanvasElement | null>(null)
  const crumbSpritesRef = useRef<HTMLCanvasElement[]>([])

  const init = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    carrotsRef.current = Array.from({ length: CARROT_COUNT }, () =>
      createCarrot(canvas.width, canvas.height),
    )
    // Pre-render sprites once
    carrotSpriteRef.current = prerenderEmoji('🥕', CARROT_FONT_SIZE)
    rabbitSpriteRef.current = prerenderEmoji('🐰', RABBIT_SIZE)
    // Crumb sizes: pre-render a few
    crumbSpritesRef.current = [8, 12, 16, 20].map(s => prerenderEmoji('🥕', s))
  }, [])

  useEffect(() => {
    init()

    const handleResize = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    const handleMouseMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseLeave = () => {
      mouseRef.current = { x: -200, y: -200 }
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('mouseleave', handleMouseLeave)

    const canvas = canvasRef.current!
    const ctx = canvas.getContext('2d')!

    function animate() {
      const w = canvas.width
      const h = canvas.height
      const carrots = carrotsRef.current
      const mouse = mouseRef.current
      const carrotSprite = carrotSpriteRef.current
      const rabbitSprite = rabbitSpriteRef.current
      if (!carrotSprite || !rabbitSprite) {
        animRef.current = requestAnimationFrame(animate)
        return
      }

      ctx.clearRect(0, 0, w, h)

      // --- Update carrots ---
      for (const c of carrots) {
        if (c.eaten) {
          c.eatenProgress += 1 / EAT_DURATION
          if (c.eatenProgress >= 1) {
            const respawned = createCarrot(w, h)
            const angle = Math.random() * Math.PI * 2
            const dist = 250 + Math.random() * 300
            respawned.x = mouse.x + Math.cos(angle) * dist
            respawned.y = mouse.y + Math.sin(angle) * dist
            respawned.x = Math.max(30, Math.min(w - 30, respawned.x))
            respawned.y = Math.max(30, Math.min(h - 30, respawned.y))
            Object.assign(c, respawned)
          }
          continue
        }

        c.x += c.vx
        c.y += c.vy
        c.rotation += c.rotationSpeed

        if (c.x < 20 || c.x > w - 20) c.vx *= -1
        if (c.y < 20 || c.y > h - 20) c.vy *= -1
        c.x = Math.max(20, Math.min(w - 20, c.x))
        c.y = Math.max(20, Math.min(h - 20, c.y))

        const dx = c.x - mouse.x
        const dy = c.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < EAT_RADIUS) {
          c.eaten = true
          c.eatenProgress = 0
          c.eatStartX = c.x
          c.eatStartY = c.y
          c.eatTargetX = mouse.x
          c.eatTargetY = mouse.y
          rabbitEatingRef.current = EAT_DURATION + 10
          // Spawn crumbs — fewer for perf
          const count = 4 + Math.floor(Math.random() * 3)
          const crumbs = crumbsRef.current
          for (let i = 0; i < count; i++) {
            const a = Math.random() * Math.PI * 2
            const spd = 1.5 + Math.random() * 3
            crumbs.push({
              x: c.x, y: c.y,
              vx: Math.cos(a) * spd, vy: Math.sin(a) * spd - 1,
              life: 1,
              size: Math.floor(Math.random() * 4), // index into crumbSprites
              rotation: Math.random() * Math.PI * 2,
              rotationSpeed: (Math.random() - 0.5) * 0.3,
            })
          }
        }
      }

      // --- Update crumbs (in-place filter) ---
      const crumbs = crumbsRef.current
      let writeIdx = 0
      for (let i = 0; i < crumbs.length; i++) {
        const cr = crumbs[i]
        cr.x += cr.vx
        cr.y += cr.vy
        cr.vy += 0.05
        cr.vx *= 0.98
        cr.rotation += cr.rotationSpeed
        cr.life -= 0.02
        if (cr.life > 0) {
          crumbs[writeIdx++] = cr
        }
      }
      crumbs.length = writeIdx

      // --- Draw connections between nearby carrots ---
      // Batch all connection lines in one path per style for less state changes
      ctx.lineCap = 'round'

      // Carrot-to-carrot connections
      for (let i = 0; i < carrots.length; i++) {
        const a = carrots[i]
        if (a.eaten) continue
        for (let j = i + 1; j < carrots.length; j++) {
          const b = carrots[j]
          if (b.eaten) continue
          const dx = a.x - b.x
          const dy = a.y - b.y
          const distSq = dx * dx + dy * dy
          if (distSq < CONNECTION_DISTANCE * CONNECTION_DISTANCE) {
            const dist = Math.sqrt(distSq)
            const opacity = 1 - dist / CONNECTION_DISTANCE
            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = `rgba(255, 160, 60, ${opacity * 0.55})`
            ctx.lineWidth = 1.5 + opacity * 1.5
            ctx.stroke()
          }
        }
      }

      // Mouse-to-carrot connections
      const mouseConnDist = CONNECTION_DISTANCE * 1.5
      const mouseConnDistSq = mouseConnDist * mouseConnDist
      for (const c of carrots) {
        if (c.eaten) continue
        const dx = c.x - mouse.x
        const dy = c.y - mouse.y
        const distSq = dx * dx + dy * dy
        if (distSq < mouseConnDistSq) {
          const dist = Math.sqrt(distSq)
          const opacity = 1 - dist / mouseConnDist
          ctx.beginPath()
          ctx.moveTo(mouse.x, mouse.y)
          ctx.lineTo(c.x, c.y)
          ctx.strokeStyle = `rgba(160, 230, 160, ${opacity * 0.5})`
          ctx.lineWidth = 2 + opacity * 1.5
          ctx.stroke()
        }
      }

      // --- Draw carrots ---
      const halfSprite = carrotSprite.width / 2
      for (const c of carrots) {
        if (c.eaten) {
          const t = c.eatenProgress
          if (t < 1) {
            const ease = t * t
            const cx = c.eatStartX + (c.eatTargetX - c.eatStartX) * ease
            const cy = c.eatStartY + (c.eatTargetY - c.eatStartY) * ease
            const scale = 1 - t
            const spin = c.rotation + t * 8

            ctx.save()
            ctx.translate(cx, cy)
            ctx.rotate(spin)
            ctx.globalAlpha = scale
            ctx.drawImage(carrotSprite, -halfSprite * scale, -halfSprite * scale, carrotSprite.width * scale, carrotSprite.height * scale)
            ctx.restore()
          }
          continue
        }

        const dx = c.x - mouse.x
        const dy = c.y - mouse.y
        const dist = Math.sqrt(dx * dx + dy * dy)

        ctx.save()
        if (dist < EAT_RADIUS * 3.5) {
          const glowIntensity = 1 - dist / (EAT_RADIUS * 3.5)
          ctx.shadowColor = `rgba(255, 165, 0, ${glowIntensity})`
          ctx.shadowBlur = 40 * glowIntensity

          const tremble = glowIntensity * 4
          ctx.translate(
            c.x + (Math.random() - 0.5) * tremble,
            c.y + (Math.random() - 0.5) * tremble,
          )
        } else {
          ctx.translate(c.x, c.y)
        }
        ctx.rotate(c.rotation)
        ctx.drawImage(carrotSprite, -halfSprite, -halfSprite)
        ctx.restore()
      }

      // --- Draw crumbs ---
      const crumbSprites = crumbSpritesRef.current
      for (const cr of crumbs) {
        const sprite = crumbSprites[cr.size] || crumbSprites[0]
        const half = sprite.width / 2
        ctx.save()
        ctx.translate(cr.x, cr.y)
        ctx.rotate(cr.rotation)
        ctx.globalAlpha = cr.life
        ctx.drawImage(sprite, -half, -half)
        ctx.restore()
      }

      // --- Draw rabbit cursor ---
      if (mouse.x > 0 && mouse.y > 0) {
        const halfRabbit = rabbitSprite.width / 2
        if (rabbitEatingRef.current > 0) {
          rabbitEatingRef.current--
          const bounce = Math.sin(rabbitEatingRef.current * 0.5) * 3
          ctx.drawImage(rabbitSprite, mouse.x - halfRabbit, mouse.y - halfRabbit + bounce)
        } else {
          ctx.drawImage(rabbitSprite, mouse.x - halfRabbit, mouse.y - halfRabbit)
        }
      }

      animRef.current = requestAnimationFrame(animate)
    }

    animRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animRef.current)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [init])

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 10,
        pointerEvents: 'none',
      }}
    />
  )
}
