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
function buildNumberChoices(answer: number): number[] {
  const choiceSet = new Set<number>([answer])
  let guard = 0
  while (choiceSet.size < 4 && guard < 30) {
    guard++
    const candidate = answer + rand(-5, 5)
    if (candidate > 0 && !choiceSet.has(candidate)) choiceSet.add(candidate)
  }
  let pad = 1
  while (choiceSet.size < 4) {
    if (!choiceSet.has(pad)) choiceSet.add(pad)
    pad++
  }
  return shuffle(Array.from(choiceSet))
}

const SHAPES = [
  { id: 'square', label: 'ריבוע', sides: 4 },
  { id: 'rectangle', label: 'מלבן', sides: 4 },
  { id: 'triangle', label: 'משולש', sides: 3 },
  { id: 'circle', label: 'עיגול', sides: 0 },
  { id: 'pentagon', label: 'מחומש', sides: 5 },
  { id: 'hexagon', label: 'משושה', sides: 6 },
]

function ShapeVisual({ shapeId, size = 120 }: { shapeId: string; size?: number }) {
  const color = '#7226f5'
  if (shapeId === 'circle') return <svg width={size} height={size}><circle cx={size / 2} cy={size / 2} r={size / 2 - 6} fill={color} /></svg>
  if (shapeId === 'square') return <svg width={size} height={size}><rect x={8} y={8} width={size - 16} height={size - 16} fill={color} /></svg>
  if (shapeId === 'rectangle') return <svg width={size} height={size}><rect x={4} y={size / 4} width={size - 8} height={size / 2} fill={color} /></svg>
  if (shapeId === 'triangle') return <svg width={size} height={size}><polygon points={`${size / 2},6 ${size - 6},${size - 6} 6,${size - 6}`} fill={color} /></svg>
  if (shapeId === 'pentagon' || shapeId === 'hexagon') {
    const sides = shapeId === 'pentagon' ? 5 : 6
    const r = size / 2 - 8
    const cx = size / 2
    const cy = size / 2
    const points = Array.from({ length: sides }, (_, i) => {
      const angle = (Math.PI * 2 * i) / sides - Math.PI / 2
      return `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`
    }).join(' ')
    return <svg width={size} height={size}><polygon points={points} fill={color} /></svg>
  }
  return null
}

interface Question {
  kind: 'identify' | 'perimeter' | 'area' | 'angle'
  prompt: string
  shapeId?: string
  width?: number
  height?: number
  angleDeg?: number
  choices: string[]
  answer: string
}

function AngleVisual({ degrees, size = 140 }: { degrees: number; size?: number }) {
  const cx = 20
  const cy = size - 20
  const len = size - 40
  const rad = (degrees * Math.PI) / 180
  const x2 = cx + len * Math.cos(-rad)
  const y2 = cy + len * Math.sin(-rad)
  return (
    <svg width={size} height={size}>
      <line x1={cx} y1={cy} x2={cx + len} y2={cy} stroke="#1a1a2e" strokeWidth={4} />
      <line x1={cx} y1={cy} x2={x2} y2={y2} stroke="#7226f5" strokeWidth={4} />
    </svg>
  )
}

function generateQuestion(difficulty: Difficulty): Question {
  if (difficulty === 'easy' || (difficulty === 'medium' && Math.random() < 0.4)) {
    const shape = SHAPES[rand(0, SHAPES.length - 1)]
    const choiceSet = new Set<string>([shape.label])
    let guard = 0
    while (choiceSet.size < 4 && guard < 20) {
      guard++
      choiceSet.add(SHAPES[rand(0, SHAPES.length - 1)].label)
    }
    return { kind: 'identify', prompt: 'איך קוראים לצורה הזו?', shapeId: shape.id, choices: shuffle(Array.from(choiceSet)), answer: shape.label }
  }

  if (difficulty === 'hard' && Math.random() < 0.35) {
    const angleTypes = [
      { deg: 90, label: 'זווית ישרה' },
      { deg: rand(20, 70), label: 'זווית חדה' },
      { deg: rand(110, 160), label: 'זווית קהה' },
    ]
    const pick = angleTypes[rand(0, angleTypes.length - 1)]
    const choices = shuffle(['זווית ישרה', 'זווית חדה', 'זווית קהה'])
    return { kind: 'angle', prompt: 'איזה סוג זווית מוצגת?', angleDeg: pick.deg, choices, answer: pick.label }
  }

  // Only 'medium' and 'hard' ever reach here - 'easy' always returns from
  // the shape-identification branch above.
  const width = rand(2, 12)
  const height = rand(2, 12)
  const isArea = Math.random() < 0.5
  if (isArea) {
    const answer = width * height
    return {
      kind: 'area',
      prompt: `מהו השטח של מלבן שרוחבו ${width} ואורכו ${height}?`,
      width,
      height,
      choices: buildNumberChoices(answer).map(String),
      answer: String(answer),
    }
  }
  const answer = (width + height) * 2
  return {
    kind: 'perimeter',
    prompt: `מהו ההיקף של מלבן שרוחבו ${width} ואורכו ${height}?`,
    width,
    height,
    choices: buildNumberChoices(answer).map(String),
    answer: String(answer),
  }
}

export default function GeometryGame({ onFinish }: FunGameProps) {
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
    return <DifficultySelector title="📐 גיאומטריה" subtitle="בחרו רמת קושי" options={DIFFICULTY_OPTIONS} onSelect={start} />
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
          {question.shapeId && <ShapeVisual shapeId={question.shapeId} />}
          {question.angleDeg !== undefined && <AngleVisual degrees={question.angleDeg} />}
          {(question.kind === 'area' || question.kind === 'perimeter') && question.width && question.height && (
            <svg width={140} height={100}>
              <rect
                x={10}
                y={10}
                width={Math.min(120, question.width * 10)}
                height={Math.min(80, question.height * 10)}
                fill="#7226f5"
                opacity={0.85}
              />
            </svg>
          )}
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
              className={`rounded-xl2 py-5 font-fun text-xl font-extrabold shadow-card card-outline btn-pressable transition-colors ${
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
