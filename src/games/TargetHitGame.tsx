import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { FunGameProps } from './types'
import type { LevelId } from '../types'
import { useSound } from '../hooks/useSound'
import { useI18n } from '../i18n/LanguageContext'

interface DifficultyCfg {
  sizeRange: [number, number]
  lifespanMs: number
  spawnMs: number
  moving: boolean
  speedRange: [number, number]
}

const DIFFICULTY: Record<LevelId, DifficultyCfg> = {
  beginner: { sizeRange: [66, 86], lifespanMs: 1700, spawnMs: 800, moving: false, speedRange: [0, 0] },
  basic: { sizeRange: [50, 68], lifespanMs: 1300, spawnMs: 650, moving: false, speedRange: [0, 0] },
  intermediate: { sizeRange: [46, 62], lifespanMs: 1300, spawnMs: 600, moving: true, speedRange: [12, 22] },
  advanced: { sizeRange: [32, 48], lifespanMs: 900, spawnMs: 480, moving: true, speedRange: [20, 34] },
}

const LEVEL_DOT: Record<LevelId, string> = {
  beginner: '🟢',
  basic: '🟡',
  intermediate: '🟠',
  advanced: '🔴',
}

const LEVEL_ORDER: LevelId[] = ['beginner', 'basic', 'intermediate', 'advanced']

const TARGET_COLORS = ['#ff2d82', '#0aa8f0', '#12cc65', '#7226f5']

const ROUND_SECONDS = 30
const MAX_CONCURRENT = 3

interface Target {
  id: number
  x: number
  y: number
  size: number
  special: boolean
  color: string
  vx: number
  vy: number
}

interface FloatText {
  id: number
  x: number
  y: number
  text: string
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

export default function TargetHitGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()

  const [difficulty, setDifficulty] = useState<LevelId | null>(null)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [targets, setTargets] = useState<Target[]>([])
  const [floatTexts, setFloatTexts] = useState<FloatText[]>([])
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [combo, setCombo] = useState(0)

  const idRef = useRef(0)
  const floatIdRef = useRef(0)
  const hitsRef = useRef(0)
  const missesRef = useRef(0)
  const comboRef = useRef(0)
  const finishedRef = useRef(false)
  const lifespanTimers = useRef<Map<number, number>>(new Map())
  const containerRef = useRef<HTMLDivElement>(null)

  const cfgRef = useRef<DifficultyCfg | null>(null)

  const finishGame = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    onFinish({ correct: hitsRef.current, total: hitsRef.current + missesRef.current || 1 })
  }, [onFinish])

  const removeTarget = useCallback((id: number) => {
    setTargets((prev) => prev.filter((t) => t.id !== id))
    const timer = lifespanTimers.current.get(id)
    if (timer) {
      window.clearTimeout(timer)
      lifespanTimers.current.delete(id)
    }
  }, [])

  const spawnTarget = useCallback(() => {
    const cfg = cfgRef.current
    if (!cfg || finishedRef.current) return
    setTargets((prev) => {
      if (prev.length >= MAX_CONCURRENT) return prev
      const id = idRef.current++
      const size = rand(cfg.sizeRange[0], cfg.sizeRange[1])
      const special = Math.random() < 0.12
      const color = special ? '#ffab00' : TARGET_COLORS[Math.floor(Math.random() * TARGET_COLORS.length)]
      const angle = Math.random() * Math.PI * 2
      const speed = cfg.moving ? rand(cfg.speedRange[0], cfg.speedRange[1]) : 0
      const target: Target = {
        id,
        x: rand(10, 90),
        y: rand(10, 85),
        size,
        special,
        color,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      }
      const timer = window.setTimeout(() => {
        setTargets((cur) => {
          if (cur.some((t) => t.id === id)) {
            missesRef.current += 1
            setMisses((m) => m + 1)
            comboRef.current = 0
            setCombo(0)
          }
          return cur.filter((t) => t.id !== id)
        })
        lifespanTimers.current.delete(id)
      }, cfg.lifespanMs)
      lifespanTimers.current.set(id, timer)
      return [...prev, target]
    })
  }, [])

  const hitTarget = useCallback(
    (target: Target, e: React.MouseEvent) => {
      removeTarget(target.id)
      hitsRef.current += 1
      setHits((h) => h + 1)
      comboRef.current += target.special ? 2 : 1
      setCombo(comboRef.current)
      const multiplier = 1 + Math.floor(comboRef.current / 5) * 0.5
      const gain = Math.round((target.special ? 25 : 10) * multiplier)

      const rect = containerRef.current?.getBoundingClientRect()
      let fx = target.x
      let fy = target.y
      if (rect) {
        fx = ((e.clientX - rect.left) / rect.width) * 100
        fy = ((e.clientY - rect.top) / rect.height) * 100
      }
      const ftId = floatIdRef.current++
      setFloatTexts((prev) => [...prev, { id: ftId, x: fx, y: fy, text: `+${gain}` }])
      window.setTimeout(() => setFloatTexts((prev) => prev.filter((f) => f.id !== ftId)), 650)

      play(target.special ? 'shield' : 'pop')
    },
    [play, removeTarget]
  )

  // Round timer
  useEffect(() => {
    if (!difficulty) return
    const timer = window.setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => window.clearInterval(timer)
  }, [difficulty])

  useEffect(() => {
    if (difficulty && timeLeft <= 0) {
      finishGame()
    }
  }, [timeLeft, difficulty, finishGame])

  // Spawner
  useEffect(() => {
    if (!difficulty) return
    cfgRef.current = DIFFICULTY[difficulty]
    let cancelled = false
    let timeoutId = 0
    const cfg = DIFFICULTY[difficulty]
    const scheduleNext = () => {
      timeoutId = window.setTimeout(() => {
        if (cancelled) return
        spawnTarget()
        scheduleNext()
      }, cfg.spawnMs * (0.8 + Math.random() * 0.4))
    }
    scheduleNext()
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
      lifespanTimers.current.forEach((t) => window.clearTimeout(t))
      lifespanTimers.current.clear()
    }
  }, [difficulty, spawnTarget])

  // Movement loop for moving targets
  useEffect(() => {
    if (!difficulty || !DIFFICULTY[difficulty].moving) return
    const timer = window.setInterval(() => {
      setTargets((prev) =>
        prev.map((t) => {
          let { x, y, vx, vy } = t
          x += vx * 0.06
          y += vy * 0.06
          if (x < 6 || x > 94) vx = -vx
          if (y < 6 || y > 90) vy = -vy
          return { ...t, x: Math.min(94, Math.max(6, x)), y: Math.min(90, Math.max(6, y)), vx, vy }
        })
      )
    }, 60)
    return () => window.clearInterval(timer)
  }, [difficulty])

  const comboMultiplier = 1 + Math.floor(combo / 5) * 0.5

  if (!difficulty) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h2 className="mb-1 font-fun text-xl font-extrabold text-grape-600">{tr('game_target_hit_name')}</h2>
        <p className="mb-5 text-ink/50">{tr('choose_level')}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {LEVEL_ORDER.map((lvl) => (
            <button
              key={lvl}
              onClick={() => {
                setDifficulty(lvl)
                setTimeLeft(ROUND_SECONDS)
              }}
              className="flex min-w-[110px] flex-col items-center gap-1 rounded-xl2 bg-white px-4 py-3 font-fun font-extrabold text-ink shadow-card card-outline btn-pressable transition-all hover:-translate-y-0.5"
            >
              <span className="text-2xl">{LEVEL_DOT[lvl]}</span>
              <span className="text-sm">{tr(`level_${lvl}`)}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between px-2 font-fun font-extrabold">
        <span className="rounded-full bg-grass-100 px-3 py-1 text-grass-600">{tr('score')}: {hits}</span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-600">⏱️ {Math.max(0, timeLeft)}s</span>
        {combo >= 3 ? (
          <span className="rounded-full bg-sunny-100 px-3 py-1 text-sunny-600">🔥 x{comboMultiplier}</span>
        ) : (
          <span className="rounded-full bg-candy-100 px-3 py-1 text-candy-600">{LEVEL_DOT[difficulty]}</span>
        )}
      </div>

      <div ref={containerRef} className="relative h-[440px] w-full touch-manipulation overflow-hidden rounded-blob bg-gradient-to-b from-sky-100 via-white to-grass-50 shadow-pop">
        <AnimatePresence>
          {targets.map((t) => (
            <motion.button
              key={t.id}
              onClick={(e) => hitTarget(t, e)}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0, opacity: 0, transition: { duration: 0.15 } }}
              transition={{ type: 'spring', stiffness: 320, damping: 18 }}
              style={{
                left: `${t.x}%`,
                top: `${t.y}%`,
                width: t.size,
                height: t.size,
                backgroundColor: t.color,
              }}
              className="absolute -translate-x-1/2 -translate-y-1/2 touch-manipulation rounded-full shadow-card active:scale-90"
            >
              {t.special && <span className="pointer-events-none absolute inset-0 grid place-items-center text-lg">✨</span>}
            </motion.button>
          ))}
        </AnimatePresence>

        <AnimatePresence>
          {floatTexts.map((f) => (
            <motion.span
              key={f.id}
              initial={{ opacity: 1, y: 0, scale: 0.8 }}
              animate={{ opacity: 0, y: -40, scale: 1.1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-fun text-lg font-extrabold text-candy-600"
              style={{ left: `${f.x}%`, top: `${f.y}%` }}
            >
              {f.text}
            </motion.span>
          ))}
        </AnimatePresence>
      </div>

      <p className="mt-3 text-center text-sm text-ink/50">{tr('game_target_hit_desc')}</p>
    </div>
  )
}
