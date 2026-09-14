import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { FunGameProps } from './types'
import { useSound } from '../hooks/useSound'
import { useI18n } from '../i18n/LanguageContext'
import { useProgress } from '../hooks/useProgress'
import DPad from './shared/DPad'

type MoneyType = 'coin' | 'bill' | 'gem' | 'bonusTime'

const MONEY_ICON: Record<MoneyType, string> = { coin: '🪙', bill: '💵', gem: '💎', bonusTime: '⏳' }
const MONEY_VALUE: Record<MoneyType, number> = { coin: 5, bill: 15, gem: 30, bonusTime: 0 }

const ROUND_SECONDS = 45
const MAX_CONCURRENT = 6
const PLAYER_RADIUS = 4.5
const COMBO_WINDOW_MS = 2200
const PICKUP_RADIUS = 6

interface Obstacle {
  x: number
  y: number
  r: number
  activeAt: number
}
interface DangerZone {
  x: number
  y: number
  r: number
  activeAt: number
}
interface MoneyItem {
  id: number
  x: number
  y: number
  type: MoneyType
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function buildObstacles(): Obstacle[] {
  return [
    { x: 30, y: 30, r: 7, activeAt: 0 },
    { x: 70, y: 65, r: 7, activeAt: 0 },
    { x: 50, y: 50, r: 6, activeAt: 12 },
    { x: 20, y: 70, r: 6, activeAt: 20 },
    { x: 80, y: 25, r: 6, activeAt: 28 },
  ]
}
function buildZones(): DangerZone[] {
  return [
    { x: 15, y: 45, r: 10, activeAt: 8 },
    { x: 85, y: 55, r: 10, activeAt: 16 },
    { x: 50, y: 15, r: 9, activeAt: 26 },
  ]
}

export default function MoneyGrabGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()
  const { progress } = useProgress()
  const best = progress.bestScores['money_grab'] ?? 0

  const [phase, setPhase] = useState<'start' | 'playing' | 'ended'>('start')
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [items, setItems] = useState<MoneyItem[]>([])
  const [player, setPlayer] = useState({ x: 50, y: 50 })
  const [inDanger, setInDanger] = useState(false)
  const [floatTexts, setFloatTexts] = useState<{ id: number; x: number; y: number; text: string }[]>([])

  const containerRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(0)
  const ftIdRef = useRef(0)
  const playerRef = useRef(player)
  const heldDirRef = useRef<[number, number] | null>(null)
  const heldKeysRef = useRef<Record<string, boolean>>({})
  const comboRef = useRef(0)
  const lastPickupRef = useRef(0)
  const scoreRef = useRef(0)
  const elapsedRef = useRef(0)
  const obstaclesRef = useRef<Obstacle[]>([])
  const zonesRef = useRef<DangerZone[]>([])
  const finishedRef = useRef(false)
  const itemsRef = useRef<MoneyItem[]>([])

  useEffect(() => {
    playerRef.current = player
  }, [player])
  useEffect(() => {
    itemsRef.current = items
  }, [items])
  useEffect(() => {
    scoreRef.current = score
  }, [score])

  const startGame = () => {
    finishedRef.current = false
    obstaclesRef.current = buildObstacles()
    zonesRef.current = buildZones()
    elapsedRef.current = 0
    comboRef.current = 0
    scoreRef.current = 0
    setScore(0)
    setCombo(0)
    setItems([])
    setPlayer({ x: 50, y: 50 })
    setTimeLeft(ROUND_SECONDS)
    setPhase('playing')
  }

  const gainMoney = useCallback(
    (item: MoneyItem, e?: { clientX: number; clientY: number }) => {
      setItems((prev) => prev.filter((i) => i.id !== item.id))
      if (item.type === 'bonusTime') {
        setTimeLeft((t) => t + 8)
        play('shield')
        return
      }
      const now = performance.now()
      if (now - lastPickupRef.current < COMBO_WINDOW_MS) {
        comboRef.current += 1
      } else {
        comboRef.current = 1
      }
      lastPickupRef.current = now
      setCombo(comboRef.current)
      const multiplier = 1 + Math.floor(comboRef.current / 4) * 0.5
      const gain = Math.round(MONEY_VALUE[item.type] * multiplier)
      setScore((s) => s + gain)
      play(item.type === 'gem' ? 'success' : 'coin')

      const rect = containerRef.current?.getBoundingClientRect()
      let fx = item.x
      let fy = item.y
      if (rect && e) {
        fx = ((e.clientX - rect.left) / rect.width) * 100
        fy = ((e.clientY - rect.top) / rect.height) * 100
      }
      const ftId = ftIdRef.current++
      setFloatTexts((prev) => [...prev, { id: ftId, x: fx, y: fy, text: `+${gain}` }])
      window.setTimeout(() => setFloatTexts((prev) => prev.filter((f) => f.id !== ftId)), 600)
    },
    [play]
  )

  const finishGame = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    setPhase('ended')
    play('success')
  }, [play])

  // Round timer
  useEffect(() => {
    if (phase !== 'playing') return
    const t = window.setInterval(() => setTimeLeft((v) => v - 1), 1000)
    return () => window.clearInterval(t)
  }, [phase])
  useEffect(() => {
    if (phase === 'playing' && timeLeft <= 0) finishGame()
  }, [timeLeft, phase, finishGame])

  // Spawner (escalating rate as time passes)
  useEffect(() => {
    if (phase !== 'playing') return
    let cancelled = false
    let timeoutId = 0
    const schedule = () => {
      const elapsed = ROUND_SECONDS - timeLeft
      const spawnMs = Math.max(420, 950 - elapsed * 12)
      timeoutId = window.setTimeout(() => {
        if (cancelled) return
        setItems((prev) => {
          if (prev.length >= MAX_CONCURRENT) return prev
          const roll = Math.random()
          const type: MoneyType = roll < 0.06 ? 'bonusTime' : roll < 0.16 ? 'gem' : roll < 0.42 ? 'bill' : 'coin'
          let x = 0
          let y = 0
          let tries = 0
          do {
            x = rand(8, 92)
            y = rand(8, 92)
            tries++
          } while (tries < 8 && obstaclesRef.current.some((o) => elapsedRef.current >= o.activeAt && Math.hypot(x - o.x, y - o.y) < o.r + 5))
          return [...prev, { id: idRef.current++, x, y, type }]
        })
        schedule()
      }, spawnMs)
    }
    schedule()
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Keyboard
  useEffect(() => {
    if (phase !== 'playing') return
    const onDown = (e: KeyboardEvent) => {
      heldKeysRef.current[e.key.toLowerCase()] = true
    }
    const onUp = (e: KeyboardEvent) => {
      heldKeysRef.current[e.key.toLowerCase()] = false
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [phase])

  // Main loop: movement + obstacle collision + pickup + danger drain
  useEffect(() => {
    if (phase !== 'playing') return
    const t = window.setInterval(() => {
      elapsedRef.current += 0.05
      const k = heldKeysRef.current
      const dir = heldDirRef.current
      const speed = 2.4
      let dx = 0
      let dy = 0
      if (k['arrowleft'] || k['a']) dx -= speed
      if (k['arrowright'] || k['d']) dx += speed
      if (k['arrowup'] || k['w']) dy -= speed
      if (k['arrowdown'] || k['s']) dy += speed
      if (dir) {
        dx += dir[1] * speed
        dy += dir[0] * speed
      }
      if (dx !== 0 || dy !== 0) {
        setPlayer((p) => {
          const active = obstaclesRef.current.filter((o) => elapsedRef.current >= o.activeAt)
          let nx = p.x + dx
          let ny = p.y + dy
          nx = Math.min(95, Math.max(5, nx))
          ny = Math.min(95, Math.max(5, ny))
          for (const o of active) {
            if (Math.hypot(nx - o.x, p.y - o.y) < o.r + PLAYER_RADIUS) nx = p.x
            if (Math.hypot(nx - o.x, ny - o.y) < o.r + PLAYER_RADIUS) ny = p.y
          }
          return { x: nx, y: ny }
        })
      }

      const p = playerRef.current
      const activeZones = zonesRef.current.filter((z) => elapsedRef.current >= z.activeAt)
      const danger = activeZones.some((z) => Math.hypot(p.x - z.x, p.y - z.y) < z.r)
      setInDanger(danger)
      if (danger) {
        comboRef.current = 0
        setCombo(0)
        setScore((s) => Math.max(0, s - 1))
      }

      const hit = itemsRef.current.find((it) => Math.hypot(it.x - p.x, it.y - p.y) < PICKUP_RADIUS)
      if (hit) gainMoney(hit)
    }, 100)
    return () => window.clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const dpadPress = (dir: [number, number]) => {
    heldDirRef.current = dir
  }
  const dpadRelease = (dir: [number, number]) => {
    if (heldDirRef.current && heldDirRef.current[0] === dir[0] && heldDirRef.current[1] === dir[1]) heldDirRef.current = null
  }

  const comboMultiplier = 1 + Math.floor(combo / 4) * 0.5

  if (phase === 'start') {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h2 className="mb-1 font-fun text-xl font-extrabold text-sunny-600">{tr('game_money_grab_name')}</h2>
        <p className="mb-5 text-ink/50">{tr('game_money_grab_desc')}</p>
        <button
          onClick={startGame}
          className="rounded-full bg-sunny-500 px-8 py-3 font-fun text-lg font-extrabold text-white shadow-card btn-pressable"
        >
          ▶ התחילו
        </button>
      </div>
    )
  }

  if (phase === 'ended') {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="rounded-xl2 bg-white p-6 shadow-card card-outline">
          <p className="mb-3 font-fun text-2xl font-extrabold text-sunny-600">⏱️ הזמן נגמר!</p>
          <div className="space-y-2 text-lg font-fun font-extrabold text-ink">
            <p>💰 סכום שנאסף: {score}</p>
            <p>⭐ {tr('score')}: {score}</p>
            <p>🏆 {tr('best_score')}: {Math.max(best, score)}</p>
            <p>⏱️ זמן: {ROUND_SECONDS} שניות</p>
          </div>
          <button
            onClick={() => onFinish({ correct: score, total: Math.max(score, Math.round(score * 1.2)) || 1 })}
            className="mt-5 rounded-full bg-grape-500 px-8 py-3 font-fun text-lg font-extrabold text-white shadow-card btn-pressable"
          >
            המשיכו ➡
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2 px-2 font-fun font-extrabold">
        <span className="rounded-full bg-sunny-100 px-3 py-1 text-sunny-600">💰 {score}</span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-600">⏱️ {Math.max(0, timeLeft)}s</span>
        {combo >= 2 && <span className="rounded-full bg-candy-100 px-3 py-1 text-candy-600">🔥 x{comboMultiplier}</span>}
      </div>

      <div
        ref={containerRef}
        dir="ltr"
        className="relative h-[440px] w-full touch-none overflow-hidden rounded-blob bg-gradient-to-b from-grass-100 via-white to-sunny-50 shadow-pop"
      >
        {obstaclesRef.current.map((o, i) => (
          <div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink/70 shadow-card"
            style={{
              left: `${o.x}%`,
              top: `${o.y}%`,
              width: `${o.r * 2}%`,
              height: `${o.r * 2}%`,
              opacity: elapsedRef.current >= o.activeAt ? 1 : 0.15,
            }}
          />
        ))}

        {zonesRef.current.map((z, i) => (
          <motion.div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-candy-500/30"
            style={{ left: `${z.x}%`, top: `${z.y}%`, width: `${z.r * 2}%`, height: `${z.r * 2}%`, opacity: elapsedRef.current >= z.activeAt ? 1 : 0.1 }}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
        ))}

        <AnimatePresence>
          {items.map((it) => (
            <motion.span
              key={it.id}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-2xl"
              style={{ left: `${it.x}%`, top: `${it.y}%` }}
            >
              {MONEY_ICON[it.type]}
            </motion.span>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {floatTexts.map((f) => (
            <motion.span
              key={f.id}
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 0, y: -40 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55 }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-fun text-lg font-extrabold text-sunny-600"
              style={{ left: `${f.x}%`, top: `${f.y}%` }}
            >
              {f.text}
            </motion.span>
          ))}
        </AnimatePresence>

        <motion.div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 grid h-[9%] w-[9%] place-items-center rounded-full bg-grape-500 text-xl shadow-glow"
          animate={{ left: `${player.x}%`, top: `${player.y}%`, boxShadow: inDanger ? '0 0 0 6px rgba(255,45,130,0.35)' : '0 0 0 0 rgba(0,0,0,0)' }}
          transition={{ left: { duration: 0.09, ease: 'linear' }, top: { duration: 0.09, ease: 'linear' } }}
        >
          🏃
        </motion.div>
      </div>

      <DPad onPress={dpadPress} onRelease={dpadRelease} />

      <p className="mt-3 text-center text-sm text-ink/50">{tr('game_money_grab_desc')}</p>
    </div>
  )
}
