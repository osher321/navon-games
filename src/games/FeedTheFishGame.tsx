import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { FunGameProps } from './types'
import type { LevelId } from '../types'
import { useSound } from '../hooks/useSound'
import { useI18n } from '../i18n/LanguageContext'

type FoodType = 'normal' | 'bonus' | 'special' | 'bad'

interface DifficultyCfg {
  fallSpeed: [number, number]
  spawnMs: number
}

const DIFFICULTY: Record<LevelId, DifficultyCfg> = {
  beginner: { fallSpeed: [5, 8], spawnMs: 950 },
  basic: { fallSpeed: [7, 11], spawnMs: 780 },
  intermediate: { fallSpeed: [10, 15], spawnMs: 620 },
  advanced: { fallSpeed: [14, 20], spawnMs: 480 },
}
const LEVEL_DOT: Record<LevelId, string> = { beginner: '🟢', basic: '🟡', intermediate: '🟠', advanced: '🔴' }
const LEVEL_ORDER: LevelId[] = ['beginner', 'basic', 'intermediate', 'advanced']

const ROUND_SECONDS = 45
const MAX_CONCURRENT = 4
const FISH_CATCH_RADIUS = 8

const FOOD_ICON: Record<FoodType, string> = { normal: '🍎', bonus: '🧁', special: '🌟', bad: '☠️' }
const FOOD_POINTS: Record<FoodType, number> = { normal: 5, bonus: 20, special: 12, bad: 0 }

interface Food {
  id: number
  x: number
  y: number
  vy: number
  type: FoodType
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function pickFoodType(): FoodType {
  const r = Math.random()
  if (r < 0.08) return 'bad'
  if (r < 0.16) return 'bonus'
  if (r < 0.28) return 'special'
  return 'normal'
}

const BG_FISH = [
  { color: '#4FB0C9', y: 18, size: 26, dur: 9, delay: 0 },
  { color: '#E0A637', y: 62, size: 20, dur: 12, delay: 1.5 },
  { color: '#FF6FA0', y: 40, size: 22, dur: 10.5, delay: 3 },
]

export default function FeedTheFishGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()

  const [difficulty, setDifficulty] = useState<LevelId | null>(null)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const [foods, setFoods] = useState<Food[]>([])
  const [fish, setFish] = useState({ x: 50, y: 55 })
  const [score, setScore] = useState(0)
  const [lives, setLives] = useState(3)
  const [bubbles, setBubbles] = useState<{ id: number; x: number }[]>([])
  const [feedPulse, setFeedPulse] = useState(false)
  const [special, setSpecial] = useState(false)

  const containerRef = useRef<HTMLDivElement>(null)
  const idRef = useRef(0)
  const bubbleIdRef = useRef(0)
  const fishRef = useRef(fish)
  const goodEatenRef = useRef(0)
  const badEatenRef = useRef(0)
  const finishedRef = useRef(false)
  const specialUntilRef = useRef(0)
  const dragRef = useRef(false)
  const heldKeysRef = useRef<Record<string, boolean>>({})
  const cfgRef = useRef<DifficultyCfg | null>(null)
  const foodsRef = useRef<Food[]>([])

  useEffect(() => {
    fishRef.current = fish
  }, [fish])
  useEffect(() => {
    foodsRef.current = foods
  }, [foods])

  const finishGame = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    onFinish({ correct: goodEatenRef.current, total: goodEatenRef.current + badEatenRef.current || 1 })
  }, [onFinish])

  const eatFood = useCallback(
    (food: Food) => {
      if (food.type === 'bad') {
        badEatenRef.current += 1
        play('wrong')
        setLives((l) => {
          const next = Math.max(0, l - 1)
          if (next <= 0) window.setTimeout(finishGame, 300)
          return next
        })
      } else {
        goodEatenRef.current += 1
        const mult = performance.now() < specialUntilRef.current ? 2 : 1
        setScore((s) => s + FOOD_POINTS[food.type] * mult)
        play(food.type === 'bonus' ? 'success' : 'coin')
        if (food.type === 'special') {
          specialUntilRef.current = performance.now() + 5000
          setSpecial(true)
          window.setTimeout(() => setSpecial(false), 5000)
        }
      }
      setFeedPulse(true)
      window.setTimeout(() => setFeedPulse(false), 180)
    },
    [play, finishGame]
  )

  // Round timer
  useEffect(() => {
    if (!difficulty) return
    const t = window.setInterval(() => setTimeLeft((v) => v - 1), 1000)
    return () => window.clearInterval(t)
  }, [difficulty])
  useEffect(() => {
    if (difficulty && timeLeft <= 0) finishGame()
  }, [timeLeft, difficulty, finishGame])

  // Spawner
  useEffect(() => {
    if (!difficulty) return
    cfgRef.current = DIFFICULTY[difficulty]
    let cancelled = false
    let timeoutId = 0
    const schedule = () => {
      timeoutId = window.setTimeout(() => {
        if (cancelled) return
        setFoods((prev) => {
          if (prev.length >= MAX_CONCURRENT || finishedRef.current) return prev
          const cfg = cfgRef.current!
          const type = pickFoodType()
          return [...prev, { id: idRef.current++, x: rand(10, 90), y: -5, vy: rand(cfg.fallSpeed[0], cfg.fallSpeed[1]), type }]
        })
        schedule()
      }, cfgRef.current!.spawnMs * (0.75 + Math.random() * 0.5))
    }
    schedule()
    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
    }
  }, [difficulty])

  // Bubbles (decorative, capped and self-removing)
  useEffect(() => {
    if (!difficulty) return
    const t = window.setInterval(() => {
      setBubbles((prev) => {
        const next = prev.length > 10 ? prev.slice(prev.length - 10) : prev
        return [...next, { id: bubbleIdRef.current++, x: rand(5, 95) }]
      })
    }, 500)
    return () => window.clearInterval(t)
  }, [difficulty])

  // Fish movement (keyboard velocity + pointer drag)
  useEffect(() => {
    if (!difficulty) return
    const onKeyDown = (e: KeyboardEvent) => {
      heldKeysRef.current[e.key.toLowerCase()] = true
    }
    const onKeyUp = (e: KeyboardEvent) => {
      heldKeysRef.current[e.key.toLowerCase()] = false
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [difficulty])

  // Main game loop: falling food + collision + fish keyboard movement
  useEffect(() => {
    if (!difficulty) return
    const t = window.setInterval(() => {
      const k = heldKeysRef.current
      if (!dragRef.current) {
        setFish((p) => {
          let { x, y } = p
          const speed = 2.6
          if (k['arrowleft'] || k['a']) x -= speed
          if (k['arrowright'] || k['d']) x += speed
          if (k['arrowup'] || k['w']) y -= speed
          if (k['arrowdown'] || k['s']) y += speed
          return { x: Math.min(94, Math.max(6, x)), y: Math.min(90, Math.max(10, y)) }
        })
      }
      const fx = fishRef.current.x
      const fy = fishRef.current.y
      const survivors: Food[] = []
      const eaten: Food[] = []
      for (const f of foodsRef.current) {
        const ny = f.y + f.vy * 0.06
        const dist = Math.hypot(f.x - fx, ny - fy)
        if (dist < FISH_CATCH_RADIUS) {
          eaten.push({ ...f, y: ny })
          continue
        }
        if (ny > 104) continue
        survivors.push({ ...f, y: ny })
      }
      setFoods(survivors)
      for (const f of eaten) eatFood(f)
    }, 60)
    return () => window.clearInterval(t)
  }, [difficulty, eatFood])

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragRef.current) return
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    setFish({ x: Math.min(94, Math.max(6, x)), y: Math.min(90, Math.max(10, y)) })
  }

  if (!difficulty) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h2 className="mb-1 font-fun text-xl font-extrabold text-sky-600">{tr('game_feed_fish_name')}</h2>
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
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2 px-2 font-fun font-extrabold">
        <span className="rounded-full bg-candy-100 px-3 py-1 text-candy-600">{'❤️'.repeat(Math.max(0, lives)) || '💔'}</span>
        <span className="rounded-full bg-sunny-100 px-3 py-1 text-sunny-600">{tr('score')}: {score}</span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-600">⏱️ {Math.max(0, timeLeft)}s</span>
        {special && <span className="rounded-full bg-white px-3 py-1 shadow-card">🌟 x2</span>}
      </div>

      <div
        ref={containerRef}
        onPointerDown={(e) => {
          dragRef.current = true
          e.currentTarget.setPointerCapture?.(e.pointerId)
          handlePointerMove(e)
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={() => (dragRef.current = false)}
        onPointerCancel={() => (dragRef.current = false)}
        className="relative h-[440px] w-full touch-none overflow-hidden rounded-blob bg-gradient-to-b from-sky-300 via-sky-100 to-grass-50 shadow-pop"
      >
        {/* decorative background fish */}
        {BG_FISH.map((bf, i) => (
          <motion.span
            key={i}
            aria-hidden="true"
            className="pointer-events-none absolute select-none opacity-70"
            style={{ top: `${bf.y}%`, fontSize: bf.size, color: bf.color }}
            animate={{ left: ['-8%', '104%'] }}
            transition={{ duration: bf.dur, repeat: Infinity, delay: bf.delay, ease: 'linear' }}
          >
            🐠
          </motion.span>
        ))}

        {/* bubbles */}
        <AnimatePresence>
          {bubbles.map((b) => (
            <motion.span
              key={b.id}
              aria-hidden="true"
              className="pointer-events-none absolute rounded-full border border-white/70 bg-white/20"
              style={{ left: `${b.x}%`, width: 8, height: 8, bottom: 0 }}
              initial={{ opacity: 0.8, y: 0 }}
              animate={{ opacity: 0, y: -420 }}
              transition={{ duration: 4.5, ease: 'linear' }}
              onAnimationComplete={() => setBubbles((prev) => prev.filter((x) => x.id !== b.id))}
            />
          ))}
        </AnimatePresence>

        {/* plants */}
        <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-[6%] text-4xl opacity-90">🪸</span>
        <span aria-hidden="true" className="pointer-events-none absolute bottom-0 left-[22%] text-3xl opacity-80">🌿</span>
        <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-[10%] text-4xl opacity-90">🪸</span>
        <span aria-hidden="true" className="pointer-events-none absolute bottom-0 right-[26%] text-3xl opacity-80">🌿</span>

        {/* food */}
        {foods.map((f) => (
          <span
            key={f.id}
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-2xl leading-none"
            style={{ left: `${f.x}%`, top: `${f.y}%` }}
          >
            {FOOD_ICON[f.type]}
          </span>
        ))}

        {/* player fish */}
        <motion.div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-4xl"
          animate={{ left: `${fish.x}%`, top: `${fish.y}%`, scale: feedPulse ? 1.3 : 1 }}
          transition={{ left: { duration: 0.08, ease: 'linear' }, top: { duration: 0.08, ease: 'linear' }, scale: { duration: 0.18 } }}
        >
          🐟
        </motion.div>
      </div>

      <p className="mt-3 text-center text-sm text-ink/50">{tr('game_feed_fish_desc')}</p>
    </div>
  )
}
