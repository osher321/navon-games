import { useCallback, useEffect, useRef, useState } from 'react'
import type { TouchEvent } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { FunGameProps } from './types'
import { useSound } from '../hooks/useSound'

type Dir = 'up' | 'down' | 'left' | 'right'
type Tile = { id: number; value: number } | null
type Grid = Tile[][]

const SIZE = 4
const BEST_KEY = 'navon_2048_best'

let idCounter = 1

function emptyGrid(): Grid {
  return Array.from({ length: SIZE }, () => Array<Tile>(SIZE).fill(null))
}

function cloneGrid(g: Grid): Grid {
  return g.map((row) => row.map((t) => (t ? { ...t } : null)))
}

function emptyCells(g: Grid): [number, number][] {
  const cells: [number, number][] = []
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (!g[r][c]) cells.push([r, c])
  return cells
}

function spawnTile(g: Grid): Grid {
  const empties = emptyCells(g)
  if (empties.length === 0) return g
  const [r, c] = empties[Math.floor(Math.random() * empties.length)]
  const next = cloneGrid(g)
  next[r][c] = { id: idCounter++, value: Math.random() < 0.9 ? 2 : 4 }
  return next
}

function slideLine(line: Tile[]): { line: Tile[]; gained: number; moved: boolean } {
  const filtered = line.filter((t): t is NonNullable<Tile> => t !== null)
  const merged: Tile[] = []
  let gained = 0
  let i = 0
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i].value === filtered[i + 1].value) {
      const newValue = filtered[i].value * 2
      merged.push({ id: filtered[i].id, value: newValue })
      gained += newValue
      i += 2
    } else {
      merged.push(filtered[i])
      i += 1
    }
  }
  while (merged.length < SIZE) merged.push(null)
  const moved = line.some((t, idx) => t?.id !== merged[idx]?.id || t?.value !== merged[idx]?.value)
  return { line: merged, gained, moved }
}

function move(g: Grid, dir: Dir): { grid: Grid; gained: number; moved: boolean } {
  const next = cloneGrid(g)
  let totalGained = 0
  let anyMoved = false

  if (dir === 'left' || dir === 'right') {
    for (let r = 0; r < SIZE; r++) {
      const line = dir === 'right' ? [...next[r]].reverse() : next[r]
      const result = slideLine(line)
      totalGained += result.gained
      anyMoved = anyMoved || result.moved
      next[r] = dir === 'right' ? [...result.line].reverse() : result.line
    }
  } else {
    for (let c = 0; c < SIZE; c++) {
      let col: Tile[] = [next[0][c], next[1][c], next[2][c], next[3][c]]
      if (dir === 'down') col = col.reverse()
      const result = slideLine(col)
      totalGained += result.gained
      anyMoved = anyMoved || result.moved
      const finalCol = dir === 'down' ? [...result.line].reverse() : result.line
      for (let r = 0; r < SIZE; r++) next[r][c] = finalCol[r]
    }
  }

  return { grid: next, gained: totalGained, moved: anyMoved }
}

function canMove(g: Grid): boolean {
  if (emptyCells(g).length > 0) return true
  for (let r = 0; r < SIZE; r++)
    for (let c = 0; c < SIZE; c++) {
      const v = g[r][c]!.value
      if (c < SIZE - 1 && g[r][c + 1]?.value === v) return true
      if (r < SIZE - 1 && g[r + 1][c]?.value === v) return true
    }
  return false
}

const TILE_COLORS: Record<number, string> = {
  2: 'bg-white text-ink',
  4: 'bg-sunny-100 text-ink',
  8: 'bg-sunny-300 text-white',
  16: 'bg-candy-300 text-white',
  32: 'bg-candy-400 text-white',
  64: 'bg-candy-500 text-white',
  128: 'bg-grape-300 text-white',
  256: 'bg-grape-400 text-white',
  512: 'bg-grape-500 text-white',
  1024: 'bg-grape-600 text-white',
  2048: 'bg-ink text-white',
}

function loadBest(): number {
  try {
    return Number(window.localStorage.getItem(BEST_KEY) || '0')
  } catch {
    return 0
  }
}

export default function Game2048({ onFinish }: FunGameProps) {
  const { play } = useSound()
  const [grid, setGrid] = useState<Grid>(() => spawnTile(spawnTile(emptyGrid())))
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(loadBest)
  const [gameOver, setGameOver] = useState(false)
  const [won, setWon] = useState(false)
  const gridRef = useRef(grid)
  const finishedRef = useRef(false)
  const touchStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    gridRef.current = grid
  }, [grid])

  const handleMove = useCallback(
    (dir: Dir) => {
      if (gameOver) return
      const result = move(gridRef.current, dir)
      if (!result.moved) return
      play(result.gained > 0 ? 'coin' : 'click')
      const spawned = spawnTile(result.grid)
      gridRef.current = spawned
      setGrid(spawned)

      if (result.gained > 0) {
        setScore((s) => {
          const newScore = s + result.gained
          setBest((b) => {
            if (newScore <= b) return b
            try {
              window.localStorage.setItem(BEST_KEY, String(newScore))
            } catch {
              // storage unavailable - best score just won't persist across sessions
            }
            return newScore
          })
          return newScore
        })
      }

      if (!won && spawned.some((row) => row.some((t) => t && t.value >= 2048))) {
        setWon(true)
        play('levelup')
      }

      if (!canMove(spawned)) setGameOver(true)
    },
    [gameOver, play, won]
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const keyMap: Record<string, Dir> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }
      const dir = keyMap[e.key]
      if (dir) {
        e.preventDefault()
        handleMove(dir)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleMove])

  useEffect(() => {
    if (gameOver && !finishedRef.current) {
      finishedRef.current = true
      const correct = Math.max(1, Math.floor(score / 10))
      onFinish({ correct, total: correct })
    }
  }, [gameOver, score, onFinish])

  const onTouchStart = (e: TouchEvent) => {
    const t = e.touches[0]
    touchStart.current = { x: t.clientX, y: t.clientY }
  }
  const onTouchEnd = (e: TouchEvent) => {
    if (!touchStart.current) return
    const t = e.changedTouches[0]
    const dx = t.clientX - touchStart.current.x
    const dy = t.clientY - touchStart.current.y
    touchStart.current = null
    if (Math.max(Math.abs(dx), Math.abs(dy)) < 24) return
    if (Math.abs(dx) > Math.abs(dy)) handleMove(dx > 0 ? 'right' : 'left')
    else handleMove(dy > 0 ? 'down' : 'up')
  }

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-3 flex items-center justify-between font-fun font-extrabold">
        <span className="rounded-full bg-grass-100 px-3 py-1 text-grass-600">ניקוד: {score}</span>
        <span className="rounded-full bg-sunny-100 px-3 py-1 text-sunny-600">שיא אישי: {best}</span>
      </div>
      <p className="mb-2 text-center text-xs text-ink/50">מזגו מספרים זהים: חצי מקלדת במחשב, החלקה באצבע במובייל</p>

      <div
        className="relative grid grid-cols-4 gap-2 rounded-xl2 bg-ink/10 p-2 touch-manipulation"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        dir="ltr"
      >
        {grid.map((row, r) =>
          row.map((tile, c) => (
            <div key={`${r}-${c}`} className="relative aspect-square rounded-lg bg-ink/5">
              <AnimatePresence>
                {tile && (
                  <motion.div
                    key={tile.id}
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    className={`absolute inset-0 grid place-items-center rounded-lg text-xl font-extrabold shadow-card sm:text-2xl ${
                      TILE_COLORS[tile.value] || 'bg-ink text-white'
                    }`}
                  >
                    {tile.value}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        )}
      </div>

      {won && !gameOver && <p className="mt-4 text-center font-fun text-lg font-extrabold text-grass-600">🎉 הגעתם ל-2048! אפשר להמשיך לשחק</p>}
      {gameOver && <p className="mt-4 text-center font-fun text-lg font-extrabold text-candy-600">המשחק נגמר - ניקוד סופי: {score}</p>}

      <div className="mx-auto mt-4 grid max-w-[220px] grid-cols-3 gap-2 sm:hidden">
        <div />
        <button onClick={() => handleMove('up')} aria-label="למעלה" className="rounded-xl2 bg-white py-3 shadow-card card-outline btn-pressable">
          ⬆️
        </button>
        <div />
        <button onClick={() => handleMove('left')} aria-label="שמאלה" className="rounded-xl2 bg-white py-3 shadow-card card-outline btn-pressable">
          ⬅️
        </button>
        <button onClick={() => handleMove('down')} aria-label="למטה" className="rounded-xl2 bg-white py-3 shadow-card card-outline btn-pressable">
          ⬇️
        </button>
        <button onClick={() => handleMove('right')} aria-label="ימינה" className="rounded-xl2 bg-white py-3 shadow-card card-outline btn-pressable">
          ➡️
        </button>
      </div>
    </div>
  )
}
