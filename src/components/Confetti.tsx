// Confetti.tsx - the burst that greets a visitor who lands above the flag
// threshold. Blue and white ribbons mixed with little Israeli flags.
//
// Written on a plain canvas rather than pulling in a library: it is a few
// dozen lines, and the project takes on no new dependency for one moment of
// celebration. It runs once, cleans itself up, and does nothing at all for
// visitors who asked for reduced motion.
import { useEffect, useRef } from 'react'

const RIBBON_COLORS = ['#0038b8', '#ffffff', '#2a78d6', '#eaf1ff']
const COUNT = 90
const DURATION_MS = 4200

interface Piece {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  spin: number
  angle: number
  color: string
  isFlag: boolean
}

export default function Confetti() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return

    const context = canvas.getContext('2d')
    if (!context) return

    // Draw in CSS pixels, but back the canvas with device pixels so the
    // pieces are not fuzzy on a phone.
    const ratio = window.devicePixelRatio || 1
    const width = () => canvas.clientWidth
    const height = () => canvas.clientHeight
    const resize = () => {
      canvas.width = width() * ratio
      canvas.height = height() * ratio
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
    }
    resize()

    // Everything starts just above the top edge and falls, drifting sideways.
    const pieces: Piece[] = Array.from({ length: COUNT }, () => {
      const isFlag = Math.random() < 0.3
      return {
        x: Math.random() * width(),
        y: -20 - Math.random() * height() * 0.6,
        vx: (Math.random() - 0.5) * 1.4,
        vy: 1.6 + Math.random() * 2.2,
        // Flags carry a star now, so they need more room than a ribbon.
        size: isFlag ? 18 + Math.random() * 10 : 5 + Math.random() * 5,
        spin: (Math.random() - 0.5) * 0.12,
        angle: Math.random() * Math.PI * 2,
        color: RIBBON_COLORS[Math.floor(Math.random() * RIBBON_COLORS.length)],
        isFlag,
      }
    })

    const start = performance.now()
    let frame = 0

    /**
     * The Star of David, drawn as two overlapping filled triangles.
     *
     * Filled, not stroked: at this size a stroke is under a pixel wide and
     * the browser dissolves it into grey. Two solid triangles survive, and
     * that is the whole construction of the star anyway.
     */
    const drawStar = (radius: number) => {
      context.fillStyle = '#0038b8'
      // The second triangle is the first turned half a turn.
      for (const turn of [0, Math.PI]) {
        context.beginPath()
        for (let corner = 0; corner < 3; corner++) {
          const a = turn + (corner * 2 * Math.PI) / 3 - Math.PI / 2
          const x = Math.cos(a) * radius
          const y = Math.sin(a) * radius
          if (corner === 0) context.moveTo(x, y)
          else context.lineTo(x, y)
        }
        context.closePath()
        context.fill()
      }
    }

    const drawFlag = (size: number) => {
      const w = size
      const h = size * 0.66
      const bar = h * 0.16
      context.fillStyle = '#ffffff'
      context.fillRect(-w / 2, -h / 2, w, h)
      context.fillStyle = '#0038b8'
      context.fillRect(-w / 2, -h / 2, w, bar)
      context.fillRect(-w / 2, h / 2 - bar, w, bar)
      // Sized to the gap between the stripes, not to the flag, so it never
      // touches them however big the flag is.
      drawStar((h / 2 - bar) * 0.82)
    }

    const tick = (now: number) => {
      const elapsed = now - start
      // Fade the whole burst out over its last second.
      const fade = Math.min(1, Math.max(0, (DURATION_MS - elapsed) / 1000))
      context.clearRect(0, 0, width(), height())

      for (const piece of pieces) {
        piece.x += piece.vx
        piece.y += piece.vy
        piece.vy += 0.02 // gravity
        piece.angle += piece.spin

        context.save()
        context.globalAlpha = fade
        context.translate(piece.x, piece.y)
        context.rotate(piece.angle)
        if (piece.isFlag) {
          drawFlag(piece.size)
        } else {
          context.fillStyle = piece.color
          context.fillRect(-piece.size / 2, -piece.size / 4, piece.size, piece.size / 2)
        }
        context.restore()
      }

      if (elapsed < DURATION_MS) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)

    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('resize', resize)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-50 h-full w-full"
    />
  )
}
