import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { FunGameProps } from './types'
import { useSound } from '../hooks/useSound'
import { useI18n } from '../i18n/LanguageContext'

type ObjType = 'asteroid' | 'coin' | 'star' | 'gem' | 'shield'

interface SpaceObj {
  id: number
  type: ObjType
  left: number
  size: number
  fallMs: number
}

const ICONS: Record<ObjType, string> = {
  asteroid: '☄️',
  coin: '🪙',
  star: '⭐',
  gem: '💎',
  shield: '🛡️',
}

const STARTING_LIVES = 3
const SHIELD_MS = 5000
const HIT_INVINCIBLE_MS = 1500

const STARS = Array.from({ length: 16 }, (_, i) => ({
  left: (i * 37) % 100,
  top: (i * 53) % 100,
  delay: (i % 6) * 0.4,
  size: 2 + (i % 3),
}))

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v))
}

const KEY_TO_DIR: Record<string, 'up' | 'down' | 'left' | 'right'> = {
  ArrowUp: 'up',
  w: 'up',
  W: 'up',
  ArrowDown: 'down',
  s: 'down',
  S: 'down',
  ArrowLeft: 'left',
  a: 'left',
  A: 'left',
  ArrowRight: 'right',
  d: 'right',
  D: 'right',
}

export default function SpaceRaceGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()

  const [phase, setPhase] = useState<'playing' | 'over'>('playing')
  const [shipPos, setShipPos] = useState({ x: 50, y: 78 })
  const [objects, setObjects] = useState<SpaceObj[]>([])
  const [lives, setLives] = useState(STARTING_LIVES)
  const [score, setScore] = useState(0)
  const [shieldOn, setShieldOn] = useState(false)
  const [invincible, setInvincible] = useState(false)
  const [distance, setDistance] = useState(0)

  const containerRef = useRef<HTMLDivElement>(null)
  const shipElRef = useRef<HTMLDivElement>(null)
  const elRefs = useRef<Map<number, HTMLDivElement>>(new Map())
  const processedRef = useRef<Set<number>>(new Set())
  const objectsRef = useRef(objects)
  const idRef = useRef(0)

  const draggingRef = useRef(false)
  const heldKeysRef = useRef<Set<'up' | 'down' | 'left' | 'right'>>(new Set())

  const shieldRef = useRef(false)
  const invincibleRef = useRef(false)
  const shieldTimeoutRef = useRef<number>()
  const collectedRef = useRef(0)
  const mistakesRef = useRef(0)
  const finishedRef = useRef(false)
  const phaseRef = useRef(phase)

  const startTimeRef = useRef(performance.now())
  const elapsedMsRef = useRef(0)

  useEffect(() => {
    objectsRef.current = objects
  }, [objects])
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const finishGame = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    setPhase('over')
    const distanceBonus = Math.floor(elapsedMsRef.current / 10000)
    const correct = collectedRef.current + distanceBonus
    onFinish({ correct, total: correct + mistakesRef.current || 1 })
  }, [onFinish])

  const spawnObject = useCallback((speedMul: number) => {
    const roll = Math.random()
    let type: ObjType
    if (roll < 0.42) type = 'asteroid'
    else if (roll < 0.66) type = 'coin'
    else if (roll < 0.82) type = 'star'
    else if (roll < 0.93) type = 'gem'
    else type = 'shield'

    const id = idRef.current++
    const left = 8 + Math.random() * 84
    const size = type === 'asteroid' ? 30 + Math.random() * 20 : 24 + Math.random() * 8
    const baseFall = type === 'asteroid' ? 3000 : 3500
    const fallMs = Math.max(1100, baseFall / speedMul)
    setObjects((prev) => [...prev, { id, type, left, size, fallMs }])
  }, [])

  // Difficulty-ramping spawner
  useEffect(() => {
    if (phase !== 'playing') return
    let cancelled = false
    let timeoutId = 0
    const scheduleNext = () => {
      const elapsedSec = elapsedMsRef.current / 1000
      const speedMul = Math.min(2.4, 1 + elapsedSec / 40)
      const spawnMs = Math.max(360, 900 - elapsedSec * 8)
      timeoutId = window.setTimeout(() => {
        if (cancelled) return
        spawnObject(speedMul)
        scheduleNext()
      }, spawnMs)
    }
    timeoutId = window.setTimeout(scheduleNext, 400)
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [phase, spawnObject])

  const handleCollision = useCallback(
    (id: number) => {
      if (processedRef.current.has(id)) return
      const obj = objectsRef.current.find((o) => o.id === id)
      if (!obj) return
      processedRef.current.add(id)
      setObjects((prev) => prev.filter((o) => o.id !== id))

      if (obj.type === 'asteroid') {
        if (shieldRef.current) {
          play('shield')
          return
        }
        if (invincibleRef.current) return
        mistakesRef.current += 1
        play('hit')
        invincibleRef.current = true
        setInvincible(true)
        window.setTimeout(() => {
          invincibleRef.current = false
          setInvincible(false)
        }, HIT_INVINCIBLE_MS)
        setLives((l) => {
          const next = Math.max(0, l - 1)
          if (next <= 0) window.setTimeout(finishGame, 400)
          return next
        })
      } else if (obj.type === 'shield') {
        play('shield')
        shieldRef.current = true
        setShieldOn(true)
        window.clearTimeout(shieldTimeoutRef.current)
        shieldTimeoutRef.current = window.setTimeout(() => {
          shieldRef.current = false
          setShieldOn(false)
        }, SHIELD_MS)
      } else {
        const gain = obj.type === 'gem' ? 3 : obj.type === 'star' ? 2 : 1
        collectedRef.current += gain
        setScore((s) => s + gain)
        play('coin')
      }
    },
    [play, finishGame]
  )

  // Keyboard controls
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const dir = KEY_TO_DIR[e.key]
      if (dir) {
        heldKeysRef.current.add(dir)
        e.preventDefault()
      }
    }
    const onUp = (e: KeyboardEvent) => {
      const dir = KEY_TO_DIR[e.key]
      if (dir) heldKeysRef.current.delete(dir)
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  // Master loop: keyboard movement, elapsed tracking, collision detection
  useEffect(() => {
    if (phase !== 'playing') return
    const timer = window.setInterval(() => {
      elapsedMsRef.current = performance.now() - startTimeRef.current

      if (!draggingRef.current && heldKeysRef.current.size > 0) {
        let dx = 0
        let dy = 0
        if (heldKeysRef.current.has('left')) dx -= 3.4
        if (heldKeysRef.current.has('right')) dx += 3.4
        if (heldKeysRef.current.has('up')) dy -= 3.4
        if (heldKeysRef.current.has('down')) dy += 3.4
        if (dx !== 0 || dy !== 0) {
          setShipPos((p) => ({ x: clamp(p.x + dx, 6, 94), y: clamp(p.y + dy, 12, 90) }))
        }
      }

      const shipRect = shipElRef.current?.getBoundingClientRect()
      if (shipRect) {
        const marginX = shipRect.width * 0.28
        const marginY = shipRect.height * 0.28
        elRefs.current.forEach((el, id) => {
          if (processedRef.current.has(id)) return
          const r = el.getBoundingClientRect()
          const overlap = !(
            r.right < shipRect.left + marginX ||
            r.left > shipRect.right - marginX ||
            r.bottom < shipRect.top + marginY ||
            r.top > shipRect.bottom - marginY
          )
          if (overlap) handleCollision(id)
        })
      }
    }, 70)
    return () => window.clearInterval(timer)
  }, [phase, handleCollision])

  // HUD distance ticker
  useEffect(() => {
    if (phase !== 'playing') return
    const timer = window.setInterval(() => {
      setDistance(Math.floor((elapsedMsRef.current / 1000) * 9))
    }, 500)
    return () => window.clearInterval(timer)
  }, [phase])

  const updateShipFromPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = clamp(((e.clientX - rect.left) / rect.width) * 100, 6, 94)
    const y = clamp(((e.clientY - rect.top) / rect.height) * 100, 12, 90)
    setShipPos({ x, y })
  }

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (phaseRef.current !== 'playing') return
    draggingRef.current = true
    e.currentTarget.setPointerCapture?.(e.pointerId)
    updateShipFromPointer(e)
  }
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!draggingRef.current) return
    updateShipFromPointer(e)
  }
  const endDrag = () => {
    draggingRef.current = false
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between px-2 font-fun font-extrabold">
        <span className="rounded-full bg-candy-100 px-3 py-1 text-candy-600">{'❤️'.repeat(Math.max(0, lives)) || '💔'}</span>
        <span className="rounded-full bg-sunny-100 px-3 py-1 text-sunny-600">
          {tr('score')}: {score}
        </span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-600">🚀 {distance}m</span>
      </div>

      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        className="relative h-[460px] w-full touch-none overflow-hidden rounded-blob bg-gradient-to-b from-ink via-grape-700 to-grape-900 shadow-pop"
      >
        {STARS.map((s, i) => (
          <span
            key={i}
            className="twinkle absolute rounded-full bg-white"
            style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
          />
        ))}

        <AnimatePresence>
          {objects.map((obj) => (
            <motion.div
              key={obj.id}
              ref={(el) => {
                if (el) elRefs.current.set(obj.id, el)
                else elRefs.current.delete(obj.id)
              }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 select-none"
              style={{ left: `${obj.left}%`, fontSize: obj.size }}
              initial={{ top: '-12%' }}
              animate={{ top: '114%' }}
              exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
              transition={{ duration: obj.fallMs / 1000, ease: 'linear' }}
              onAnimationComplete={() => setObjects((prev) => prev.filter((o) => o.id !== obj.id))}
            >
              {ICONS[obj.type]}
            </motion.div>
          ))}
        </AnimatePresence>

        <div
          ref={shipElRef}
          className="absolute -translate-x-1/2 -translate-y-1/2 text-4xl transition-[left,top] duration-75 sm:text-5xl"
          style={{ left: `${shipPos.x}%`, top: `${shipPos.y}%`, opacity: invincible ? 0.5 : 1 }}
        >
          <span className={shieldOn ? 'inline-block rounded-full drop-shadow-[0_0_14px_rgba(120,200,255,0.95)]' : 'inline-block'}>🚀</span>
        </div>
      </div>

      <p className="mt-3 text-center text-sm text-ink/50">{tr('game_space_race_desc')}</p>
    </div>
  )
}
