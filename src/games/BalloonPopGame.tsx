import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { FunGameProps } from './types'
import { useSound } from '../hooks/useSound'
import { useI18n } from '../i18n/LanguageContext'

const ROUND_SECONDS = 28
const SPAWN_MS = 950
const POP_DURATION_MS = 420

const COLORS = [
  { gradient: 'from-candy-400 to-candy-500', solid: '#ff2d82' },
  { gradient: 'from-sky-400 to-sky-500', solid: '#0aa8f0' },
  { gradient: 'from-grass-400 to-grass-500', solid: '#12cc65' },
  { gradient: 'from-sunny-400 to-sunny-500', solid: '#ffab00' },
  { gradient: 'from-grape-400 to-grape-500', solid: '#7226f5' },
]

interface Balloon {
  id: number
  left: number
  isBomb: boolean
  duration: number
  color: (typeof COLORS)[number]
}

interface Particle {
  dx: number
  dy: number
  rotate: number
}

interface PopEffect {
  id: number
  left: number
  top: number
  isBomb: boolean
  color: (typeof COLORS)[number]
  particles: Particle[]
}

function makeParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.6
    const distance = 26 + Math.random() * 26
    return {
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      rotate: (Math.random() - 0.5) * 240,
    }
  })
}

export default function BalloonPopGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()
  const [balloons, setBalloons] = useState<Balloon[]>([])
  const [pops, setPops] = useState<PopEffect[]>([])
  const [popped, setPopped] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const idRef = useRef(0)
  const poppedRef = useRef(0)
  const mistakesRef = useRef(0)
  const finishedRef = useRef(false)
  const [running, setRunning] = useState(true)
  const containerRef = useRef<HTMLDivElement>(null)
  const popTimeoutsRef = useRef<number[]>([])

  useEffect(() => {
    if (!running) return
    const spawnTimer = setInterval(() => {
      const id = idRef.current++
      const balloon: Balloon = {
        id,
        left: 6 + Math.random() * 84,
        isBomb: Math.random() < 0.22,
        duration: 3.4 + Math.random() * 1.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }
      setBalloons((b) => [...b, balloon])
    }, SPAWN_MS)

    const countdown = setInterval(() => setTimeLeft((t) => t - 1), 1000)

    return () => {
      clearInterval(spawnTimer)
      clearInterval(countdown)
    }
  }, [running])

  useEffect(() => {
    if (timeLeft <= 0 && !finishedRef.current) {
      finishedRef.current = true
      setRunning(false)
      onFinish({ correct: poppedRef.current, total: poppedRef.current + mistakesRef.current || 1 })
    }
  }, [timeLeft, onFinish])

  useEffect(() => {
    const timeouts = popTimeoutsRef.current
    return () => {
      timeouts.forEach((t) => window.clearTimeout(t))
    }
  }, [])

  const pop = (balloon: Balloon, event: MouseEvent<HTMLButtonElement>) => {
    // Award score/sound immediately on click; the explosion visual plays independently afterward.
    if (balloon.isBomb) {
      mistakesRef.current += 1
      setMistakes((m) => m + 1)
      play('wrong')
    } else {
      poppedRef.current += 1
      setPopped((p) => p + 1)
      play('pop')
    }

    const btnRect = event.currentTarget.getBoundingClientRect()
    const containerRect = containerRef.current?.getBoundingClientRect()
    let left = balloon.left
    let top = 50
    if (containerRect && containerRect.width > 0 && containerRect.height > 0) {
      left = ((btnRect.left + btnRect.width / 2 - containerRect.left) / containerRect.width) * 100
      top = ((btnRect.top + btnRect.height / 2 - containerRect.top) / containerRect.height) * 100
    }

    setBalloons((b) => b.filter((x) => x.id !== balloon.id))

    const popId = idRef.current++
    setPops((p) => [
      ...p,
      { id: popId, left, top, isBomb: balloon.isBomb, color: balloon.color, particles: makeParticles(balloon.isBomb ? 8 : 7) },
    ])
    const timeoutId = window.setTimeout(() => {
      setPops((p) => p.filter((x) => x.id !== popId))
      popTimeoutsRef.current = popTimeoutsRef.current.filter((t) => t !== timeoutId)
    }, POP_DURATION_MS)
    popTimeoutsRef.current.push(timeoutId)
  }

  const escaped = (balloon: Balloon) => {
    setBalloons((b) => {
      const stillThere = b.some((x) => x.id === balloon.id)
      if (stillThere && !balloon.isBomb) {
        mistakesRef.current += 1
        setMistakes((m) => m + 1)
      }
      return b.filter((x) => x.id !== balloon.id)
    })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between px-2 font-fun font-extrabold">
        <span className="rounded-full bg-grass-100 px-3 py-1 text-grass-600">🎈 {popped}</span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-600">⏱️ {Math.max(0, timeLeft)}s</span>
        <span className="rounded-full bg-candy-100 px-3 py-1 text-candy-600">💥 {mistakes}</span>
      </div>
      <div
        ref={containerRef}
        className="relative h-[440px] w-full touch-manipulation overflow-hidden rounded-blob bg-gradient-to-b from-sky-200 via-sky-100 to-white shadow-pop"
      >
        <AnimatePresence>
          {balloons.map((balloon) => (
            <motion.button
              key={balloon.id}
              onClick={(e) => pop(balloon, e)}
              initial={{ top: '105%' }}
              animate={{ top: '-15%' }}
              exit={{ scale: 0, opacity: 0, transition: { duration: 0.06 } }}
              transition={{ duration: balloon.duration, ease: 'linear' }}
              onAnimationComplete={() => escaped(balloon)}
              style={{ left: `${balloon.left}%` }}
              className="absolute -translate-x-1/2 touch-manipulation text-5xl active:scale-90"
            >
              {balloon.isBomb ? (
                <span className="drop-shadow-lg">💣</span>
              ) : (
                <span className={`inline-block rounded-full bg-gradient-to-b ${balloon.color.gradient} px-1 drop-shadow-lg`}>🎈</span>
              )}
            </motion.button>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {pops.map((p) => (
            <motion.div
              key={p.id}
              className="pointer-events-none absolute z-10"
              style={{ left: `${p.left}%`, top: `${p.top}%` }}
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.span
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-5xl"
                initial={{ scale: 1, opacity: 1 }}
                animate={{ scale: [1, 1.35, 0.2], opacity: [1, 1, 0] }}
                transition={{ duration: 0.22, times: [0, 0.5, 1], ease: 'easeOut' }}
              >
                {p.isBomb ? '💣' : '🎈'}
              </motion.span>
              <motion.span
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-4xl"
                initial={{ scale: 0, opacity: 0, rotate: -15 }}
                animate={{ scale: [0, 1.5, 1.1], opacity: [0, 1, 0], rotate: 0 }}
                transition={{ duration: 0.32, delay: 0.1, ease: 'easeOut' }}
              >
                {p.isBomb ? '💥' : '✨'}
              </motion.span>
              {p.particles.map((particle, i) => (
                <motion.span
                  key={i}
                  className="absolute left-1/2 top-1/2 h-2 w-3 rounded-full"
                  style={{ backgroundColor: p.isBomb ? '#4b4b55' : p.color.solid }}
                  initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 1 }}
                  animate={{ x: particle.dx, y: particle.dy, opacity: 0, rotate: particle.rotate, scale: 0.4 }}
                  transition={{ duration: 0.4, delay: 0.03, ease: 'easeOut' }}
                />
              ))}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      <p className="mt-3 text-center text-sm text-ink/50">{tr('game_balloon_pop_desc')} · 💣 = {tr('wrong_answer')}</p>
    </div>
  )
}
