import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { FunGameProps } from './types'
import { useSound } from '../hooks/useSound'
import { useI18n } from '../i18n/LanguageContext'
import DPad from './shared/DPad'

type ItemType = 'coin' | 'key' | 'speed' | 'shield' | 'magnet' | 'time'
interface Pos {
  r: number
  c: number
}

const MAX_LEVEL = 5
const STARTING_LIVES = 3
const MOVE_COOLDOWN_MS = 130
const SPEED_MOVE_COOLDOWN_MS = 75
const HIT_INVINCIBLE_MS = 1100
const POWERUP_MS = 6000
const MAGNET_RADIUS = 2

const DIRS: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
]

function cellKey(r: number, c: number) {
  return `${r},${c}`
}

function shuffled<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** Randomized recursive-backtracker over a `cellRows`x`cellCols` cell graph,
    carved into a "thick wall" char grid ((2*rows+1) x (2*cols+1), '#'/'.')
    so every run produces a genuinely different, fully-connected maze -
    never the same fixed layout twice. */
function generateMaze(cellRows: number, cellCols: number): string[] {
  const rows = 2 * cellRows + 1
  const cols = 2 * cellCols + 1
  const grid: string[][] = Array.from({ length: rows }, () => Array(cols).fill('#'))
  const visited = Array.from({ length: cellRows }, () => Array(cellCols).fill(false))

  function carve(r: number, c: number) {
    visited[r][c] = true
    grid[2 * r + 1][2 * c + 1] = '.'
    for (const [dr, dc] of shuffled(DIRS)) {
      const nr = r + dr
      const nc = c + dc
      if (nr < 0 || nc < 0 || nr >= cellRows || nc >= cellCols || visited[nr][nc]) continue
      grid[2 * r + 1 + dr][2 * c + 1 + dc] = '.'
      carve(nr, nc)
    }
  }
  carve(0, 0)
  return grid.map((row) => row.join(''))
}

function bfsFrom(maze: string[], start: Pos, rows: number, cols: number): Map<string, number> {
  const dist = new Map<string, number>()
  dist.set(cellKey(start.r, start.c), 0)
  const queue: Pos[] = [start]
  let qi = 0
  while (qi < queue.length) {
    const cur = queue[qi++]
    const d = dist.get(cellKey(cur.r, cur.c))!
    for (const [dr, dc] of DIRS) {
      const nr = cur.r + dr
      const nc = cur.c + dc
      if (nr < 0 || nc < 0 || nr >= rows || nc >= cols) continue
      if (maze[nr][nc] === '#') continue
      const k = cellKey(nr, nc)
      if (!dist.has(k)) {
        dist.set(k, d + 1)
        queue.push({ r: nr, c: nc })
      }
    }
  }
  return dist
}

interface LevelState {
  maze: string[]
  rows: number
  cols: number
  start: Pos
  exit: Pos
  items: Record<string, ItemType>
  traps: Set<string>
  keyRequired: boolean
  timeLimit: number
}

function buildLevel(level: number): LevelState {
  const size = Math.min(9, 5 + level)
  const maze = generateMaze(size, size)
  const rows = maze.length
  const cols = maze[0].length
  const start: Pos = { r: 1, c: 1 }
  const exit: Pos = { r: rows - 2, c: cols - 2 }
  const dist = bfsFrom(maze, start, rows, cols)
  const startKey = cellKey(start.r, start.c)
  const exitKey = cellKey(exit.r, exit.c)
  const reachable = shuffled(Array.from(dist.keys()).filter((k) => k !== startKey && k !== exitKey))

  const items: Record<string, ItemType> = {}
  const traps = new Set<string>()
  const keyRequired = level >= 2
  let idx = 0

  if (keyRequired) {
    const farEnough = reachable.filter((k) => (dist.get(k) ?? 0) > 3)
    const keyPos = farEnough[0] ?? reachable[0]
    if (keyPos) items[keyPos] = 'key'
  }

  const trapCount = level >= 3 ? Math.min(6, (level - 2) * 3) : 0
  for (; idx < reachable.length && traps.size < trapCount; idx++) {
    const k = reachable[idx]
    if (items[k]) continue
    if ((dist.get(k) ?? 0) < 3) continue
    traps.add(k)
  }

  for (; idx < reachable.length; idx++) {
    const k = reachable[idx]
    if (items[k] || traps.has(k)) continue
    const roll = Math.random()
    if (roll < 0.04) items[k] = 'speed'
    else if (roll < 0.08) items[k] = 'shield'
    else if (roll < 0.11) items[k] = 'magnet'
    else if (roll < 0.15) items[k] = 'time'
    else if (roll < 0.55) items[k] = 'coin'
  }

  return { maze, rows, cols, start, exit, items, traps, keyRequired, timeLimit: 55 + level * 10 }
}

const KEY_DIR: Record<string, [number, number]> = {
  ArrowUp: [-1, 0],
  w: [-1, 0],
  W: [-1, 0],
  ArrowDown: [1, 0],
  s: [1, 0],
  S: [1, 0],
  ArrowLeft: [0, -1],
  a: [0, -1],
  A: [0, -1],
  ArrowRight: [0, 1],
  d: [0, 1],
  D: [0, 1],
}

const ITEM_ICON: Record<ItemType, string> = {
  coin: '🪙',
  key: '🗝️',
  speed: '⚡',
  shield: '🛡️',
  magnet: '🧲',
  time: '⏱️',
}

export default function MazeEscapeGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()

  const [phase, setPhase] = useState<'start' | 'playing' | 'levelClear' | 'over' | 'win'>('start')
  const [level, setLevel] = useState(1)
  const levelState = useRef<LevelState | null>(null)
  const [maze, setMaze] = useState<string[]>([])
  const [items, setItems] = useState<Record<string, ItemType>>({})
  const [traps, setTraps] = useState<Set<string>>(new Set())
  const [player, setPlayer] = useState<Pos>({ r: 1, c: 1 })
  const [lives, setLives] = useState(STARTING_LIVES)
  const [score, setScore] = useState(0)
  const [timeLeft, setTimeLeft] = useState(0)
  const [invincible, setInvincible] = useState(false)
  const [shieldActive, setShieldActive] = useState(false)
  const [speedActive, setSpeedActive] = useState(false)
  const [magnetActive, setMagnetActive] = useState(false)
  const [keyCollected, setKeyCollected] = useState(false)
  const [toast, setToast] = useState<string | null>(null)

  const playerRef = useRef(player)
  const phaseRef = useRef(phase)
  const invincibleRef = useRef(false)
  const shieldRef = useRef(false)
  const heldDirRef = useRef<[number, number] | null>(null)
  const lastMoveRef = useRef(0)
  const speedUntilRef = useRef(0)
  const magnetUntilRef = useRef(0)
  const keyCollectedRef = useRef(false)
  const itemsCollectedRef = useRef(0)
  const mistakesRef = useRef(0)
  const finishedRef = useRef(false)
  const itemsRef = useRef<Record<string, ItemType>>({})

  useEffect(() => {
    playerRef.current = player
  }, [player])
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])
  useEffect(() => {
    itemsRef.current = items
  }, [items])

  const finishGame = useCallback(
    (won: boolean) => {
      if (finishedRef.current) return
      finishedRef.current = true
      setPhase(won ? 'win' : 'over')
      play(won ? 'success' : 'wrong')
      onFinish({ correct: itemsCollectedRef.current, total: itemsCollectedRef.current + mistakesRef.current || 1 })
    },
    [onFinish, play]
  )

  const loadLevel = useCallback((lvl: number) => {
    const lv = buildLevel(lvl)
    levelState.current = lv
    setMaze(lv.maze)
    setItems(lv.items)
    setTraps(lv.traps)
    setPlayer(lv.start)
    setKeyCollected(false)
    keyCollectedRef.current = false
    setTimeLeft(lv.timeLimit)
  }, [])

  const startGame = () => {
    finishedRef.current = false
    itemsCollectedRef.current = 0
    mistakesRef.current = 0
    setLevel(1)
    setLives(STARTING_LIVES)
    setScore(0)
    loadLevel(1)
    setPhase('playing')
  }

  const showToast = (msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast((t) => (t === msg ? null : t)), 1100)
  }

  const clearInvincible = useCallback((ms: number) => {
    setInvincible(true)
    invincibleRef.current = true
    window.setTimeout(() => {
      invincibleRef.current = false
      setInvincible(false)
    }, ms)
  }, [])

  const triggerTrap = useCallback(() => {
    if (invincibleRef.current || phaseRef.current !== 'playing') return
    if (shieldRef.current) {
      shieldRef.current = false
      setShieldActive(false)
      play('shield')
      showToast('🛡️ המגן חסם את המלכודת!')
      clearInvincible(600)
      return
    }
    mistakesRef.current += 1
    play('hit')
    const lv = levelState.current
    if (lv) setPlayer(lv.start)
    setLives((l) => {
      const next = Math.max(0, l - 1)
      if (next <= 0) window.setTimeout(() => finishGame(false), 350)
      return next
    })
    clearInvincible(HIT_INVINCIBLE_MS)
  }, [play, finishGame, clearInvincible])

  const advanceLevel = useCallback(() => {
    setPhase('levelClear')
    play('levelup')
    setScore((s) => s + 50 + timeLeft * 2)
    window.setTimeout(() => {
      setLevel((lv) => {
        const nextLevel = lv + 1
        if (nextLevel > MAX_LEVEL) {
          window.setTimeout(() => finishGame(true), 50)
          return lv
        }
        loadLevel(nextLevel)
        setPhase('playing')
        return nextLevel
      })
    }, 1000)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play, loadLevel, finishGame, timeLeft])

  const tryMove = useCallback((dr: number, dc: number) => {
    setPlayer((p) => {
      const nr = p.r + dr
      const nc = p.c + dc
      const lv = levelState.current
      if (!lv) return p
      if (nr < 0 || nc < 0 || nr >= lv.rows || nc >= lv.cols) return p
      if (lv.maze[nr][nc] === '#') return p
      return { r: nr, c: nc }
    })
  }, [])

  // Keyboard controls
  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      const dir = KEY_DIR[e.key]
      if (dir) {
        heldDirRef.current = dir
        e.preventDefault()
      }
    }
    const onUp = (e: KeyboardEvent) => {
      const dir = KEY_DIR[e.key]
      if (dir && heldDirRef.current && heldDirRef.current[0] === dir[0] && heldDirRef.current[1] === dir[1]) {
        heldDirRef.current = null
      }
    }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup', onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup', onUp)
    }
  }, [])

  // Movement loop
  useEffect(() => {
    if (phase !== 'playing') return
    const timer = window.setInterval(() => {
      const now = performance.now()
      const cooldown = now < speedUntilRef.current ? SPEED_MOVE_COOLDOWN_MS : MOVE_COOLDOWN_MS
      if (heldDirRef.current && now - lastMoveRef.current >= cooldown) {
        lastMoveRef.current = now
        tryMove(heldDirRef.current[0], heldDirRef.current[1])
      }
    }, 40)
    return () => window.clearInterval(timer)
  }, [phase, tryMove])

  // Countdown timer
  useEffect(() => {
    if (phase !== 'playing') return
    const timer = window.setInterval(() => setTimeLeft((t) => t - 1), 1000)
    return () => window.clearInterval(timer)
  }, [phase])
  useEffect(() => {
    if (phase === 'playing' && timeLeft <= 0) {
      showToast("⏱️ נגמר הזמן!")
      finishGame(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, phase])

  // Magnet auto-collect tick
  useEffect(() => {
    if (!magnetActive) return
    const timer = window.setInterval(() => {
      const p = playerRef.current
      const toCollect = Object.keys(itemsRef.current).filter((k) => {
        if (itemsRef.current[k] !== 'coin') return false
        const [r, c] = k.split(',').map(Number)
        return Math.abs(r - p.r) + Math.abs(c - p.c) <= MAGNET_RADIUS
      })
      if (toCollect.length === 0) return
      setItems((prev) => {
        const next = { ...prev }
        for (const k of toCollect) delete next[k]
        return next
      })
      itemsCollectedRef.current += toCollect.length
      setScore((s) => s + 5 * toCollect.length)
    }, 220)
    return () => window.clearInterval(timer)
  }, [magnetActive])

  // Item pickup / exit / trap check on player move
  useEffect(() => {
    if (phase !== 'playing') return
    const lv = levelState.current
    if (!lv) return
    const k = cellKey(player.r, player.c)

    if (traps.has(k)) {
      triggerTrap()
      return
    }

    if (k in items) {
      const type = items[k]
      setItems((prev) => {
        if (!(k in prev)) return prev
        const next = { ...prev }
        delete next[k]
        return next
      })
      if (type === 'coin') {
        itemsCollectedRef.current += 1
        setScore((s) => s + 5)
        play('coin')
      } else if (type === 'key') {
        itemsCollectedRef.current += 3
        keyCollectedRef.current = true
        setKeyCollected(true)
        setScore((s) => s + 15)
        play('success')
        showToast('🗝️ מצאתם את המפתח!')
      } else if (type === 'speed') {
        speedUntilRef.current = performance.now() + POWERUP_MS
        setSpeedActive(true)
        window.setTimeout(() => setSpeedActive(false), POWERUP_MS)
        play('shield')
        showToast('⚡ מהירות!')
      } else if (type === 'shield') {
        shieldRef.current = true
        setShieldActive(true)
        play('shield')
        showToast('🛡️ מגן הופעל!')
      } else if (type === 'magnet') {
        magnetUntilRef.current = performance.now() + POWERUP_MS
        setMagnetActive(true)
        window.setTimeout(() => setMagnetActive(false), POWERUP_MS)
        play('shield')
        showToast('🧲 מגנט!')
      } else if (type === 'time') {
        setTimeLeft((t) => t + 15)
        setScore((s) => s + 5)
        play('coin')
        showToast('⏱️ +15 שניות!')
      }
    }

    if (player.r === lv.exit.r && player.c === lv.exit.c) {
      if (lv.keyRequired && !keyCollectedRef.current) {
        showToast('🚪 הדלת נעולה - צריך מפתח!')
      } else {
        advanceLevel()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, phase])

  const dpadPress = (dir: [number, number]) => {
    heldDirRef.current = dir
    lastMoveRef.current = performance.now()
    tryMove(dir[0], dir[1])
  }
  const dpadRelease = (dir: [number, number]) => {
    if (heldDirRef.current && heldDirRef.current[0] === dir[0] && heldDirRef.current[1] === dir[1]) {
      heldDirRef.current = null
    }
  }

  if (phase === 'start') {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h2 className="mb-1 font-fun text-xl font-extrabold text-grape-600">{tr('game_maze_escape_name')}</h2>
        <p className="mb-5 text-ink/50">{tr('game_maze_escape_desc')}</p>
        <button
          onClick={startGame}
          className="rounded-full bg-grape-500 px-8 py-3 font-fun text-lg font-extrabold text-white shadow-card btn-pressable"
        >
          ▶ התחילו
        </button>
      </div>
    )
  }

  const lv = levelState.current
  const rows = lv?.rows ?? 13
  const cols = lv?.cols ?? 13
  const exit = lv?.exit
  const doorLocked = !!lv?.keyRequired && !keyCollected

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2 px-2 font-fun font-extrabold">
        <span className="rounded-full bg-candy-100 px-3 py-1 text-candy-600">{'❤️'.repeat(Math.max(0, lives)) || '💔'}</span>
        <span className="rounded-full bg-sunny-100 px-3 py-1 text-sunny-600">{tr('score')}: {score}</span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-600">⏱️ {Math.max(0, timeLeft)}s</span>
        <span className="rounded-full bg-grass-100 px-3 py-1 text-grass-600">🏁 {level}/{MAX_LEVEL}</span>
        {speedActive && <span className="rounded-full bg-white px-2 py-1 shadow-card">⚡</span>}
        {shieldActive && <span className="rounded-full bg-white px-2 py-1 shadow-card">🛡️</span>}
        {magnetActive && <span className="rounded-full bg-white px-2 py-1 shadow-card">🧲</span>}
      </div>

      <div
        dir="ltr"
        className="relative mx-auto aspect-square w-full max-w-[380px] overflow-hidden rounded-blob bg-grape-800 shadow-pop"
      >
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${cols}, 1fr)`, gridTemplateRows: `repeat(${rows}, 1fr)` }}>
          {maze.map((row, r) => row.split('').map((cell, c) => <div key={`${r}-${c}`} className={cell === '#' ? 'bg-grape-600/80' : ''} />))}
        </div>

        {Object.entries(items).map(([k, type]) => {
          const [r, c] = k.split(',').map(Number)
          return (
            <span
              key={k}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-[3vw] leading-none sm:text-sm"
              style={{ left: `${((c + 0.5) / cols) * 100}%`, top: `${((r + 0.5) / rows) * 100}%` }}
            >
              {ITEM_ICON[type]}
            </span>
          )
        })}

        {Array.from(traps).map((k) => {
          const [r, c] = k.split(',').map(Number)
          return (
            <span
              key={k}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-[3vw] leading-none opacity-90 sm:text-sm"
              style={{ left: `${((c + 0.5) / cols) * 100}%`, top: `${((r + 0.5) / rows) * 100}%` }}
            >
              ⚠️
            </span>
          )
        })}

        {exit && (
          <span
            className="absolute -translate-x-1/2 -translate-y-1/2 text-[3.4vw] leading-none sm:text-base"
            style={{ left: `${((exit.c + 0.5) / cols) * 100}%`, top: `${((exit.r + 0.5) / rows) * 100}%` }}
          >
            {doorLocked ? '🚪' : '🏁'}
          </span>
        )}

        <motion.div
          className="absolute grid h-[7%] w-[7%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-sunny-400 shadow-glow"
          animate={{
            left: `${((player.c + 0.5) / cols) * 100}%`,
            top: `${((player.r + 0.5) / rows) * 100}%`,
            opacity: invincible ? [1, 0.35, 1] : 1,
          }}
          transition={{
            left: { duration: 0.12, ease: 'linear' },
            top: { duration: 0.12, ease: 'linear' },
            opacity: invincible ? { duration: 0.3, repeat: Infinity } : { duration: 0.15 },
          }}
        >
          <span className="text-[2.4vw] sm:text-xs">😊</span>
        </motion.div>

        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-x-2 top-2 rounded-full bg-ink/80 px-3 py-1.5 text-center text-xs font-fun font-extrabold text-white"
          >
            {toast}
          </motion.div>
        )}

        {phase === 'levelClear' && (
          <div className="absolute inset-0 grid place-items-center bg-ink/40">
            <div className="rounded-xl2 bg-white px-6 py-4 text-center font-fun font-extrabold text-grape-600 shadow-pop">
              🎉 {tr('level_up')}
            </div>
          </div>
        )}

        {(phase === 'over' || phase === 'win') && (
          <div className="absolute inset-0 grid place-items-center bg-ink/50">
            <div className="rounded-xl2 bg-white px-6 py-5 text-center font-fun font-extrabold text-grape-600 shadow-pop">
              {phase === 'win' ? '🏆 יצאתם מכל המבוכים!' : tr('game_over')}
              <p className="mt-1 text-sm text-ink/60">{tr('score')}: {score}</p>
            </div>
          </div>
        )}
      </div>

      <DPad onPress={dpadPress} onRelease={dpadRelease} />

      <p className="mt-3 text-center text-sm text-ink/50">{tr('game_maze_escape_desc')}</p>
    </div>
  )
}
