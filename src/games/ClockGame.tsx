import { useState } from 'react'
import { motion } from 'framer-motion'
import type { FunGameProps } from './types'
import { useSound } from '../hooks/useSound'
import { useI18n } from '../i18n/LanguageContext'
import DifficultySelector from '../components/DifficultySelector'
import Ltr from '../components/Ltr'

type Difficulty = 'easy' | 'medium' | 'hard'
const DIFFICULTY_OPTIONS: { id: Difficulty; icon: string; label: string }[] = [
  { id: 'easy', icon: '🟢', label: 'קל' },
  { id: 'medium', icon: '🟡', label: 'בינוני' },
  { id: 'hard', icon: '🔴', label: 'קשה' },
]
const TOTAL_QUESTIONS = 10

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}
function pad2(n: number) {
  return String(n).padStart(2, '0')
}
function timeStr(h: number, m: number) {
  return `${pad2(h)}:${pad2(m)}`
}

/** A simple analog clock face drawn in SVG - no image assets needed. */
function ClockFace({ hour, minute, size = 160 }: { hour: number; minute: number; size?: number }) {
  const hourAngle = ((hour % 12) + minute / 60) * 30
  const minuteAngle = minute * 6
  const cx = size / 2
  const cy = size / 2
  const r = size / 2 - 8

  const point = (angleDeg: number, length: number) => {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return { x: cx + length * Math.cos(rad), y: cy + length * Math.sin(rad) }
  }
  const hourTip = point(hourAngle, r * 0.5)
  const minuteTip = point(minuteAngle, r * 0.75)

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`שעון מציג ${timeStr(hour, minute)}`}>
      <circle cx={cx} cy={cy} r={r} fill="white" stroke="#1a1a2e" strokeWidth={4} />
      {Array.from({ length: 12 }, (_, i) => {
        const p = point(i * 30, r * 0.85)
        return <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#1a1a2e" />
      })}
      <line x1={cx} y1={cy} x2={hourTip.x} y2={hourTip.y} stroke="#7226f5" strokeWidth={5} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={minuteTip.x} y2={minuteTip.y} stroke="#ff2d82" strokeWidth={3.5} strokeLinecap="round" />
      <circle cx={cx} cy={cy} r={4} fill="#1a1a2e" />
    </svg>
  )
}

interface Question {
  kind: 'read' | 'add' | 'subtract'
  prompt: string
  hour: number
  minute: number
  choices: string[]
  answer: string
}

function generateQuestion(difficulty: Difficulty): Question {
  const minuteStep = difficulty === 'easy' ? 30 : difficulty === 'medium' ? 15 : 5
  const hour = rand(1, 12)
  const minute = Math.floor(rand(0, 11) * (60 / 12 < minuteStep ? minuteStep : minuteStep) / minuteStep) * minuteStep
  const safeMinute = [0, 15, 30, 45].includes(minute) || difficulty === 'hard' ? minute : [0, 15, 30, 45][rand(0, 3)]

  if (difficulty !== 'hard' || Math.random() < 0.5) {
    const answer = timeStr(hour, safeMinute)
    const choiceSet = new Set<string>([answer])
    let guard = 0
    while (choiceSet.size < 4 && guard < 30) {
      guard++
      const h = rand(1, 12)
      const m = [0, 15, 30, 45][rand(0, 3)]
      choiceSet.add(timeStr(h, m))
    }
    return { kind: 'read', prompt: 'מה השעה שמוצגת בשעון?', hour, minute: safeMinute, choices: shuffle(Array.from(choiceSet)), answer }
  }

  // add/subtract minutes
  const isAdd = Math.random() < 0.5
  const deltaOptions = [15, 30, 45, 60]
  const delta = deltaOptions[rand(0, deltaOptions.length - 1)]
  let totalMinutes = hour * 60 + safeMinute + (isAdd ? delta : -delta)
  totalMinutes = ((totalMinutes % 720) + 720) % 720
  const resultHour = Math.floor(totalMinutes / 60) || 12
  const resultMinute = totalMinutes % 60
  const answer = timeStr(resultHour, resultMinute)
  const choiceSet = new Set<string>([answer])
  let guard = 0
  while (choiceSet.size < 4 && guard < 30) {
    guard++
    const h = rand(1, 12)
    const m = [0, 15, 30, 45][rand(0, 3)]
    choiceSet.add(timeStr(h, m))
  }
  return {
    kind: isAdd ? 'add' : 'subtract',
    prompt: `השעון מציג ${timeStr(hour, safeMinute)}. מה תהיה השעה בעוד ${delta} דקות?`.replace('בעוד', isAdd ? 'בעוד' : 'לפני'),
    hour,
    minute: safeMinute,
    choices: shuffle(Array.from(choiceSet)),
    answer,
  }
}

export default function ClockGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [qIndex, setQIndex] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [correct, setCorrect] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)

  const start = (d: Difficulty) => {
    setDifficulty(d)
    setQIndex(0)
    setCorrect(0)
    setSelected(null)
    setQuestion(generateQuestion(d))
  }

  const handleAnswer = (choice: string) => {
    if (!question || selected !== null || !difficulty) return
    setSelected(choice)
    const isCorrect = choice === question.answer
    const nextCorrect = isCorrect ? correct + 1 : correct
    if (isCorrect) {
      setCorrect(nextCorrect)
      play('correct')
    } else {
      play('wrong')
    }
    window.setTimeout(() => {
      if (qIndex + 1 >= TOTAL_QUESTIONS) {
        onFinish({ correct: nextCorrect, total: TOTAL_QUESTIONS })
      } else {
        setQIndex((i) => i + 1)
        setQuestion(generateQuestion(difficulty))
        setSelected(null)
      }
    }, 900)
  }

  if (!difficulty) {
    return <DifficultySelector title="🕐 שעון וזמן" subtitle="בחרו רמת קושי" options={DIFFICULTY_OPTIONS} onSelect={start} />
  }
  if (!question) return null

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-3 flex items-center justify-between px-2 font-fun font-extrabold">
        <span className="rounded-full bg-grass-100 px-3 py-1 text-grass-600">
          {tr('score')}: {correct}
        </span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-600">
          {qIndex + 1} / {TOTAL_QUESTIONS}
        </span>
      </div>

      <div className="rounded-blob bg-white p-6 text-center shadow-pop card-outline">
        <p className="mb-4 font-fun text-base font-extrabold text-ink">{question.prompt}</p>
        <div className="flex justify-center">
          <ClockFace hour={question.hour} minute={question.minute} />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {question.choices.map((c) => {
          const showState = selected !== null
          const isAnswer = c === question.answer
          const isSelectedWrong = selected === c && !isAnswer
          return (
            <motion.button
              key={c}
              whileTap={{ scale: 0.95 }}
              disabled={selected !== null}
              onClick={() => handleAnswer(c)}
              className={`rounded-xl2 py-5 font-fun text-2xl font-extrabold shadow-card card-outline btn-pressable transition-colors ${
                showState && isAnswer ? 'bg-grass-500 text-white' : showState && isSelectedWrong ? 'bg-candy-500 text-white' : 'bg-white text-ink'
              }`}
            >
              <Ltr>{c}</Ltr>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
