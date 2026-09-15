import { useCallback, useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { FunGameProps } from './types'
import { useSound } from '../hooks/useSound'
import { useI18n } from '../i18n/LanguageContext'
import { useProgress } from '../hooks/useProgress'

const ROUND_SECONDS = 60
const GAME_ID = 'sixty_second_challenge'

const COLORS = [
  { name: 'אדום', hex: '#D6392F' },
  { name: 'כחול', hex: '#2F6FD6' },
  { name: 'ירוק', hex: '#3FAE55' },
  { name: 'צהוב', hex: '#FFD23F' },
  { name: 'סגול', hex: '#7226F5' },
  { name: 'ורוד', hex: '#FF6FA0' },
]
const SHAPES = ['🔵', '🟢', '🟡', '🟣', '🔺', '⬛']

type TaskType = 'target' | 'coin' | 'balloon' | 'find' | 'tap' | 'color'

interface BaseTask {
  id: number
  type: TaskType
  bonus: boolean
  deadline: number
}
interface PosTask extends BaseTask {
  type: 'target' | 'coin'
  x: number
  y: number
}
interface ChoiceTask extends BaseTask {
  type: 'balloon' | 'color'
  prompt: string
  options: { name: string; hex: string }[]
  correctIndex: number
}
interface FindTask extends BaseTask {
  type: 'find'
  shape: string
  oddShape: string
  cells: number
  oddIndex: number
}
interface TapTask extends BaseTask {
  type: 'tap'
  needed: number
  progress: number
}
type Task = PosTask | ChoiceTask | FindTask | TapTask

function rand(min: number, max: number) {
  return min + Math.random() * (max - min)
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}
function sampleDistinct<T>(arr: T[], n: number): T[] {
  const copy = arr.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy.slice(0, n)
}

function buildTask(id: number, elapsedSec: number): Task {
  const windowMs = Math.max(1400, 3200 - elapsedSec * 28)
  const bonus = Math.random() < 0.15
  const deadline = performance.now() + windowMs
  const type = pick<TaskType>(['target', 'coin', 'balloon', 'find', 'tap', 'color'])

  if (type === 'target' || type === 'coin') {
    return { id, type, bonus, deadline, x: rand(15, 85), y: rand(15, 80) }
  }
  if (type === 'balloon' || type === 'color') {
    const count = 4
    const opts = sampleDistinct(COLORS, count)
    const correctIndex = Math.floor(Math.random() * count)
    const prompt = type === 'balloon' ? `לחצו על הבלון ${opts[correctIndex].name}` : `בחרו את הצבע ${opts[correctIndex].name}`
    return { id, type, bonus, deadline, prompt, options: opts, correctIndex }
  }
  if (type === 'find') {
    const [shape, oddShape] = sampleDistinct(SHAPES, 2)
    const cells = 9
    return { id, type, bonus, deadline, shape, oddShape, cells, oddIndex: Math.floor(Math.random() * cells) }
  }
  return { id, type: 'tap', bonus, deadline, needed: 3 + Math.floor(Math.random() * 3), progress: 0 }
}

export default function SixtySecondChallengeGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()
  const { progress } = useProgress()
  const best = progress.bestScores[GAME_ID] ?? 0

  const [phase, setPhase] = useState<'start' | 'playing' | 'ended'>('start')
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS)
  const [score, setScore] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [tasksCompleted, setTasksCompleted] = useState(0)
  const [task, setTask] = useState<Task | null>(null)
  const [flash, setFlash] = useState<'success' | 'fail' | null>(null)

  const taskIdRef = useRef(0)
  const startedAtRef = useRef(0)
  const comboRef = useRef(0)
  const maxComboRef = useRef(0)
  const scoreRef = useRef(0)
  const tasksCompletedRef = useRef(0)
  const finishedRef = useRef(false)

  const flashFx = (kind: 'success' | 'fail') => {
    setFlash(kind)
    window.setTimeout(() => setFlash((f) => (f === kind ? null : f)), 220)
  }

  const spawnTask = useCallback(() => {
    const elapsed = (performance.now() - startedAtRef.current) / 1000
    taskIdRef.current += 1
    setTask(buildTask(taskIdRef.current, elapsed))
  }, [])

  const succeedTask = useCallback(() => {
    if (!task) return
    comboRef.current += 1
    maxComboRef.current = Math.max(maxComboRef.current, comboRef.current)
    setCombo(comboRef.current)
    setMaxCombo(maxComboRef.current)
    const comboBonus = Math.floor(comboRef.current / 3) * 2
    const gain = (task.bonus ? 30 : 10) + comboBonus
    scoreRef.current += gain
    setScore(scoreRef.current)
    tasksCompletedRef.current += 1
    setTasksCompleted(tasksCompletedRef.current)
    play(task.bonus ? 'success' : 'correct')
    flashFx('success')
    spawnTask()
  }, [task, play, spawnTask])

  const failTask = useCallback(() => {
    comboRef.current = 0
    setCombo(0)
    play('wrong')
    flashFx('fail')
    spawnTask()
  }, [play, spawnTask])

  const finishGame = useCallback(() => {
    if (finishedRef.current) return
    finishedRef.current = true
    setPhase('ended')
    play('success')
  }, [play])

  const startGame = () => {
    finishedRef.current = false
    comboRef.current = 0
    maxComboRef.current = 0
    scoreRef.current = 0
    tasksCompletedRef.current = 0
    setScore(0)
    setCombo(0)
    setMaxCombo(0)
    setTasksCompleted(0)
    setSecondsLeft(ROUND_SECONDS)
    startedAtRef.current = performance.now()
    taskIdRef.current = 0
    setTask(buildTask(0, 0))
    setPhase('playing')
  }

  // Countdown
  useEffect(() => {
    if (phase !== 'playing') return
    const t = window.setInterval(() => setSecondsLeft((s) => s - 1), 1000)
    return () => window.clearInterval(t)
  }, [phase])
  useEffect(() => {
    if (phase === 'playing' && secondsLeft <= 0) {
      setTask(null)
      finishGame()
    }
  }, [secondsLeft, phase, finishGame])

  // Per-task expiry timer - the effect re-running (and cleaning up the
  // previous timeout) whenever `task` changes is what prevents a stale
  // failTask() firing for a task that was already completed/replaced.
  useEffect(() => {
    if (phase !== 'playing' || !task) return
    const ms = Math.max(50, task.deadline - performance.now())
    const t = window.setTimeout(failTask, ms)
    return () => window.clearTimeout(t)
  }, [task, phase, failTask])

  const tapProgress = () => {
    if (!task || task.type !== 'tap') return
    if (task.progress + 1 >= task.needed) {
      succeedTask()
      return
    }
    play('click')
    setTask({ ...task, progress: task.progress + 1 })
  }

  if (phase === 'start') {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h2 className="mb-1 font-fun text-xl font-extrabold text-candy-600">{tr('game_sixty_challenge_name')}</h2>
        <p className="mb-5 text-ink/50">{tr('game_sixty_challenge_desc')}</p>
        <button
          onClick={startGame}
          className="rounded-full bg-candy-500 px-8 py-3 font-fun text-lg font-extrabold text-white shadow-card btn-pressable"
        >
          ▶ {tr('common_start')} - ⏱️ 60
        </button>
      </div>
    )
  }

  if (phase === 'ended') {
    return (
      <div className="mx-auto max-w-md text-center">
        <div className="rounded-xl2 bg-white p-6 shadow-card card-outline">
          <p className="mb-3 font-fun text-2xl font-extrabold text-candy-600">⏱️ TIME&apos;S UP!</p>
          <div className="space-y-2 text-lg font-fun font-extrabold text-ink">
            <p>🏆 {tr('score')}: {score}</p>
            <p>🥇 {tr('best_score')}: {Math.max(best, score)}</p>
            <p>🎯 משימות שהושלמו: {tasksCompleted}</p>
            <p>🔥 ה-Combo הגבוה ביותר: {maxCombo}</p>
          </div>
          <button
            onClick={() => onFinish({ correct: score, total: Math.max(score, Math.round(score * 1.2)) || 1 })}
            className="mt-5 rounded-full bg-grape-500 px-8 py-3 font-fun text-lg font-extrabold text-white shadow-card btn-pressable"
          >
            {tr('common_continue')} ➡
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2 px-2 font-fun font-extrabold">
        <span className="rounded-full bg-candy-100 px-3 py-1 text-candy-600">⏱️ {Math.max(0, secondsLeft)}</span>
        <span className="rounded-full bg-sunny-100 px-3 py-1 text-sunny-600">{tr('score')}: {score}</span>
        {combo >= 2 && <span className="rounded-full bg-grass-100 px-3 py-1 text-grass-600">🔥 x{combo}</span>}
      </div>

      <motion.div
        animate={{ backgroundColor: flash === 'success' ? 'rgba(63,174,85,0.18)' : flash === 'fail' ? 'rgba(214,57,47,0.18)' : 'rgba(255,255,255,0)' }}
        transition={{ duration: 0.2 }}
        className="relative flex h-[400px] w-full flex-col items-center justify-center overflow-hidden rounded-blob bg-gradient-to-b from-grape-50 via-white to-sky-50 p-4 shadow-pop"
      >
        {task?.bonus && (
          <span className="absolute top-2 rounded-full bg-sunny-400 px-3 py-1 text-xs font-fun font-extrabold text-ink shadow-card">⭐ בונוס!</span>
        )}

        {task?.type === 'target' && (
          <button
            onClick={succeedTask}
            className="absolute grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-candy-500 text-2xl shadow-card active:scale-90"
            style={{ left: `${task.x}%`, top: `${task.y}%` }}
            aria-label="פגע במטרה"
          >
            🎯
          </button>
        )}

        {task?.type === 'coin' && (
          <button
            onClick={succeedTask}
            className="absolute grid h-16 w-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-sunny-400 text-2xl shadow-card active:scale-90"
            style={{ left: `${task.x}%`, top: `${task.y}%` }}
            aria-label="אסוף מטבע"
          >
            🪙
          </button>
        )}

        {task?.type === 'balloon' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-center font-fun font-extrabold text-ink">🎈 {task.prompt}</p>
            <div className="flex items-center gap-4">
              {task.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => (i === task.correctIndex ? succeedTask() : failTask())}
                  className="grid h-14 w-14 place-items-center rounded-full text-3xl shadow-card btn-pressable"
                  style={{ backgroundColor: opt.hex }}
                  aria-label={opt.name}
                >
                  🎈
                </button>
              ))}
            </div>
          </div>
        )}

        {task?.type === 'color' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-center font-fun font-extrabold text-ink">🟢 {task.prompt}</p>
            <div className="flex items-center gap-4">
              {task.options.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => (i === task.correctIndex ? succeedTask() : failTask())}
                  className="h-14 w-14 rounded-xl2 shadow-card btn-pressable"
                  style={{ backgroundColor: opt.hex }}
                  aria-label={opt.name}
                />
              ))}
            </div>
          </div>
        )}

        {task?.type === 'find' && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-center font-fun font-extrabold text-ink">🔵 מצאו את האובייקט השונה</p>
            <div className="grid grid-cols-3 gap-3">
              {Array.from({ length: task.cells }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => (i === task.oddIndex ? succeedTask() : failTask())}
                  className="grid h-14 w-14 place-items-center rounded-xl2 bg-white text-3xl shadow-card btn-pressable"
                  aria-label={i === task.oddIndex ? 'שונה' : 'רגיל'}
                >
                  {i === task.oddIndex ? task.oddShape : task.shape}
                </button>
              ))}
            </div>
          </div>
        )}

        {task?.type === 'tap' && (
          <div className="flex flex-col items-center gap-3">
            <p className="text-center font-fun font-extrabold text-ink">⚡ לחצו במהירות! ({task.progress}/{task.needed})</p>
            <button
              onClick={tapProgress}
              className="grid h-24 w-24 place-items-center rounded-full bg-grape-500 text-3xl text-white shadow-card active:scale-90"
              aria-label="לחצו במהירות"
            >
              ⚡
            </button>
          </div>
        )}
      </motion.div>

      <p className="mt-3 text-center text-sm text-ink/50">{tr('game_sixty_challenge_desc')}</p>
    </div>
  )
}
