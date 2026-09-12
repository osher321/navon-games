import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { FunGameProps } from './types'
import { useSound } from '../hooks/useSound'
import { useI18n } from '../i18n/LanguageContext'

type ItemType = 'coin' | 'star' | 'bonus'
interface Pos {
  r: number
  c: number
}
interface EnemyState {
  id: number
  r: number
  c: number
}

const ROWS = 13
const COLS = 11

const MAZES: string[][] = [
  [
    '###########',
    '#.........#',
    '#.##.#.##.#',
    '#.#...#...#',
    '#.#.###.#.#',
    '#...#.#...#',
    '###.#.#.###',
    '#...#.#...#',
    '#.#.###.#.#',
    '#.#...#...#',
    '#.##.#.##.#',
    '#.........#',
    '###########',
  ],
  [
    '###########',
    '#.........#',
    '#.#######.#',
    '#.#.....#.#',
    '#.#.###.#.#',
    '#.#.#.#.#.#',
    '#...#.#...#',
    '#.#.#.#.#.#',
    '#.#.###.#.#',
    '#.#.....#.#',
    '#.#######.#',
    '#.........#',
    '###########',
  ],
  [
    '###########',
    '#.........#',
    '#.#.#.#.#.#',
    '#.........#',
    '#.#.#.#.#.#',
    '#.........#',
    '##.#####.##',
    '#.........#',
    '#.#.#.#.#.#',
    '#.........#',
    '#.#.#.#.#.#',
    '#.........#',
    '###########',
  ],
]

const START: Pos = { r: ROWS - 2, c: 1 }
const DIRS: [number, number][] = [
  [-1, 0],
  [1, 0],
  [0, -1],
  [0, 1],
]

function cellKey(r: number, c: number) {
  return `${r},${c}`
}

function bfsFrom(maze: string[], start: Pos): Map<string, number> {
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
      if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS) continue
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

function buildLevel(levelNum: number) {
  const maze = MAZES[(levelNum - 1) % MAZES.length]
  const dist = bfsFrom(maze, START)
  const startKey = cellKey(START.r, START.c)
  const reachable = Array.from(dist.keys()).filter((k) => k !== startKey)

  const items: Record<string, ItemType> = {}
  reachable.forEach((k) => {
    const roll = Math.random()
    items[k] = roll < 0.08 ? 'bonus' : roll < 0.32 ? 'star' : 'coin'
  })

  const sorted = reachable.slice().sort((a, b) => dist.get(b)! - dist.get(a)!)
  const band = sorted.slice(0, Math.max(1, Math.floor(sorted.length * 0.5)))
  const enemyCount = Math.min(4, levelNum)
  const enemies: EnemyState[] = []
  for (let i = 0; i < enemyCount; i++) {
    const idx = Math.floor((i / Math.max(1, enemyCount)) * band.length)
    const spot = band[Math.min(idx, band.length - 1)] ?? sorted[0]
    const [r, c] = spot.split(',').map(Number)
    enemies.push({ id: i, r, c })
  }

  return { maze, items, enemies }
}

const STARTING_LIVES = 3
const MOVE_COOLDOWN_MS = 150
const HIT_INVINCIBLE_MS = 1300
const BONUS_INVINCIBLE_MS = 2500
const ENEMY_COLORS = ['#ff2d82', '#0aa8f0', '#7226f5', '#e88f00']

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

export default function MazeGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()

  const initialRef = useRef<ReturnType<typeof buildLevel>>()
  if (!initialRef.current) initialRef.current = buildLevel(1)
  const initial = initialRef.current

  const [level, setLevel] = useState(1)
  const [maze, setMaze] = useState<string[]>(initial.maze)
  const [items, setItems] = useState<Record<string, ItemType>>(initial.items)
  const [enemies, setEnemies] = useState<EnemyState[]>(initial.enemies)
  const [player, setPlayer] = useState<Pos>(START)
  const [lives, setLives] = useState(STARTING_LIVES)
  const [score, setScore] = useState(0)
  const [invincible, setInvincible] = useState(false)
  const [levelBanner, setLevelBanner] = useState(false)
  const [phase, setPhase] = useState<'playing' | 'over'>('playing')

  const mazeRef = useRef(initial.maze)
  const playerRef = useRef(player)
  const levelRef = useRef(level)
  const phaseRef = useRef(phase)
  const invincibleRef = useRef(false)
  const heldDirRef = useRef<[number, number] | null>(null)
  const lastMoveRef = useRef(0)
  const lastEnemyMoveRef = useRef(0)
  const itemsCollectedRef = useRef(0)
  const mistakesRef = useRef(0)
  const finishedRef = useRef(false)

  useEffect(() => {
    playerRef.current = player
  }, [player])
  useEffect(() => {
    levelRef.current = level
  }, [level])
  useEffect(() => {
    phaseRef.current = phase
  }, [phase])

  const finishGame = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    setPhase('over')
    onFinish({ correct: itemsCollectedRef.current, total: itemsCollectedRef.current + mistakesRef.current || 1 })
  }, [onFinish])

  const clearInvincible = useCallback((ms: number) => {
    setInvincible(true)
    invincibleRef.current = true
    window.setTimeout(() => {
      invincibleRef.current = false
      setInvincible(false)
    }, ms)
  }, [])

  const triggerHit = useCallback(() => {
    if (invincibleRef.current || phaseRef.current !== 'playing') return
    mistakesRef.current += 1
    play('hit')
    setPlayer(START)
    setEnemies(buildLevel(levelRef.current).enemies)
    setLives((l) => {
      const next = Math.max(0, l - 1)
      if (next <= 0) window.setTimeout(finishGame, 400)
      return next
    })
    clearInvincible(HIT_INVINCIBLE_MS)
  }, [play, finishGame, clearInvincible])

  const advanceLevel = useCallback(() => {
    setLevelBanner(true)
    play('levelup')
    setScore((s) => s + 20)
    window.setTimeout(() => {
      setLevel((lv) => {
        const nextLevel = lv + 1
        const next = buildLevel(nextLevel)
        mazeRef.current = next.maze
        setMaze(next.maze)
        setItems(next.items)
        setEnemies(next.enemies)
        setPlayer(START)
        return nextLevel
      })
      setLevelBanner(false)
    }, 1100)
  }, [play])

  const tryMove = useCallback((dr: number, dc: number) => {
    setPlayer((p) => {
      const nr = p.r + dr
      const nc = p.c + dc
      const m = mazeRef.current
      if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS) return p
      if (m[nr][nc] === '#') return p
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

  // Master loop: player movement cadence + enemy AI ticks
  useEffect(() => {
    if (phase !== 'playing') return
    const timer = window.setInterval(() => {
      const now = performance.now()
      if (heldDirRef.current && now - lastMoveRef.current >= MOVE_COOLDOWN_MS) {
        lastMoveRef.current = now
        tryMove(heldDirRef.current[0], heldDirRef.current[1])
      }
      const enemyTickMs = Math.max(220, 520 - (levelRef.current - 1) * 40)
      if (now - lastEnemyMoveRef.current >= enemyTickMs) {
        lastEnemyMoveRef.current = now
        const dist = bfsFrom(mazeRef.current, playerRef.current)
        const randomChance = Math.max(0.12, 0.4 - (levelRef.current - 1) * 0.04)
        setEnemies((prev) =>
          prev.map((en) => {
            const candidates: Pos[] = []
            for (const [dr, dc] of DIRS) {
              const nr = en.r + dr
              const nc = en.c + dc
              if (nr < 0 || nc < 0 || nr >= ROWS || nc >= COLS) continue
              if (mazeRef.current[nr][nc] === '#') continue
              candidates.push({ r: nr, c: nc })
            }
            if (!candidates.length) return en
            let target = candidates[0]
            if (Math.random() < randomChance) {
              target = candidates[Math.floor(Math.random() * candidates.length)]
            } else {
              let bestDist = Infinity
              for (const cand of candidates) {
                const d = dist.get(cellKey(cand.r, cand.c)) ?? Infinity
                if (d < bestDist) {
                  bestDist = d
                  target = cand
                }
              }
            }
            return { ...en, r: target.r, c: target.c }
          })
        )
      }
    }, 80)
    return () => window.clearInterval(timer)
  }, [phase, tryMove])

  // Item pickup
  useEffect(() => {
    const k = cellKey(player.r, player.c)
    if (!(k in items)) return
    const type = items[k]
    setItems((prev) => {
      if (!(k in prev)) return prev
      const next = { ...prev }
      delete next[k]
      return next
    })
    const gain = type === 'bonus' ? 3 : type === 'star' ? 2 : 1
    itemsCollectedRef.current += gain
    setScore((s) => s + gain)
    play(type === 'bonus' ? 'shield' : 'coin')
    if (type === 'bonus') clearInvincible(BONUS_INVINCIBLE_MS)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player])

  // Level clear check
  useEffect(() => {
    if (phase === 'playing' && Object.keys(items).length === 0) {
      advanceLevel()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items])

  // Collision check
  useEffect(() => {
    if (phase !== 'playing' || invincible) return
    if (enemies.some((e) => e.r === player.r && e.c === player.c)) {
      triggerHit()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player, enemies])

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

  const dpadBtn = (dir: [number, number], icon: string, extraClass = '') => (
    <button
      onPointerDown={(e) => {
        e.preventDefault()
        // Claim this pointer so a slight finger shift - or the button's own
        // active:scale-90 shrinking under the fingertip - can never hand the
        // rest of this touch stream to the page's scroll/gesture handling
        // or let it "leave" the element before pointerup fires.
        e.currentTarget.setPointerCapture?.(e.pointerId)
        dpadPress(dir)
      }}
      onPointerUp={() => dpadRelease(dir)}
      onPointerCancel={() => dpadRelease(dir)}
      className={`grid h-12 w-12 touch-none place-items-center rounded-2xl bg-white text-xl shadow-card btn-pressable active:scale-90 ${extraClass}`}
      aria-label={icon}
    >
      {icon}
    </button>
  )

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-3 flex items-center justify-between px-2 font-fun font-extrabold">
        <span className="rounded-full bg-candy-100 px-3 py-1 text-candy-600">{'❤️'.repeat(Math.max(0, lives)) || '💔'}</span>
        <span className="rounded-full bg-sunny-100 px-3 py-1 text-sunny-600">
          {tr('score')}: {score}
        </span>
        <span className="rounded-full bg-grass-100 px-3 py-1 text-grass-600">
          🏁 {level}
        </span>
      </div>

      <div dir="ltr" className="relative mx-auto aspect-[11/13] w-full max-w-[380px] overflow-hidden rounded-blob bg-grape-800 shadow-pop">
        <div className="absolute inset-0 grid" style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)`, gridTemplateRows: `repeat(${ROWS}, 1fr)` }}>
          {maze.map((row, r) =>
            row.split('').map((cell, c) => (
              <div key={`${r}-${c}`} className={cell === '#' ? 'bg-grape-600/80' : ''} />
            ))
          )}
        </div>

        {Object.entries(items).map(([k, type]) => {
          const [r, c] = k.split(',').map(Number)
          return (
            <span
              key={k}
              className="absolute -translate-x-1/2 -translate-y-1/2 text-[3.4vw] leading-none sm:text-base"
              style={{ left: `${((c + 0.5) / COLS) * 100}%`, top: `${((r + 0.5) / ROWS) * 100}%` }}
            >
              {type === 'bonus' ? '🎁' : type === 'star' ? '⭐' : '🪙'}
            </span>
          )
        })}

        {enemies.map((en, i) => (
          <motion.div
            key={en.id}
            className="absolute grid h-[7.5%] w-[7.5%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full shadow-card"
            style={{ backgroundColor: ENEMY_COLORS[i % ENEMY_COLORS.length] }}
            animate={{ left: `${((en.c + 0.5) / COLS) * 100}%`, top: `${((en.r + 0.5) / ROWS) * 100}%` }}
            transition={{ duration: 0.14, ease: 'linear' }}
          >
            <span className="text-[2.4vw] sm:text-xs">👀</span>
          </motion.div>
        ))}

        <motion.div
          className="absolute grid h-[7.5%] w-[7.5%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-sunny-400 shadow-glow"
          animate={{
            left: `${((player.c + 0.5) / COLS) * 100}%`,
            top: `${((player.r + 0.5) / ROWS) * 100}%`,
            opacity: invincible ? [1, 0.35, 1] : 1,
          }}
          transition={{
            left: { duration: 0.13, ease: 'linear' },
            top: { duration: 0.13, ease: 'linear' },
            opacity: invincible ? { duration: 0.35, repeat: Infinity } : { duration: 0.15 },
          }}
        >
          <span className="text-[2.6vw] sm:text-xs">😊</span>
        </motion.div>

        {levelBanner && (
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 grid place-items-center bg-ink/40"
          >
            <div className="rounded-xl2 bg-white px-6 py-4 text-center font-fun font-extrabold text-grape-600 shadow-pop">
              🎉 {tr('level_up')}
            </div>
          </motion.div>
        )}
      </div>

      <div
        className="fixed inset-x-0 z-30 flex touch-none items-center justify-center md:static md:z-auto md:mt-4 md:touch-auto"
        style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
      >
        <div
          dir="ltr"
          className="grid touch-none grid-cols-3 grid-rows-3 gap-1 rounded-3xl bg-white/60 p-1.5 shadow-card backdrop-blur-sm md:touch-auto md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-0"
        >
          <div />
          {dpadBtn([-1, 0], '⬆️')}
          <div />
          {dpadBtn([0, -1], '⬅️')}
          <div />
          {dpadBtn([0, 1], '➡️')}
          <div />
          {dpadBtn([1, 0], '⬇️')}
          <div />
        </div>
      </div>

      <p className="mt-3 text-center text-sm text-ink/50">{tr('game_maze_desc')}</p>
    </div>
  )
}
