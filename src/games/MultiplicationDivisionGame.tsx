import { useState } from 'react'
import { motion } from 'framer-motion'
import type { FunGameProps } from './types'
import { useSound } from '../hooks/useSound'
import { useI18n } from '../i18n/LanguageContext'
import DifficultySelector from '../components/DifficultySelector'

type Grade = 'a' | 'b' | 'g'

const GRADE_TABLE_MAX: Record<Grade, number> = { a: 5, b: 10, g: 12 }
const GRADE_LABEL: Record<Grade, string> = { a: 'כיתה א׳', b: 'כיתה ב׳', g: 'כיתה ג׳' }
const GRADE_OPTIONS: { id: Grade; icon: string; label: string }[] = [
  { id: 'a', icon: '🟢', label: GRADE_LABEL.a },
  { id: 'b', icon: '🟡', label: GRADE_LABEL.b },
  { id: 'g', icon: '🟠', label: GRADE_LABEL.g },
]

const TOTAL_QUESTIONS = 10

interface Question {
  text: string
  answer: number
  choices: number[]
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateQuestion(grade: Grade): Question {
  const max = GRADE_TABLE_MAX[grade]
  const op: '×' | '÷' = Math.random() < 0.5 ? '×' : '÷'
  const a = rand(2, max)
  const b = rand(2, max)
  const product = a * b

  let text: string
  let answer: number
  if (op === '×') {
    text = `${a} × ${b} = ?`
    answer = product
  } else {
    // Always exact division - present as product ÷ a = b, never a fraction.
    text = `${product} ÷ ${a} = ?`
    answer = b
  }

  const choiceSet = new Set<number>([answer])
  let guard = 0
  while (choiceSet.size < 4 && guard < 30) {
    guard++
    const delta = rand(-4, 4)
    const candidate = answer + delta
    if (candidate > 0 && !choiceSet.has(candidate)) choiceSet.add(candidate)
  }
  let pad = 1
  while (choiceSet.size < 4) {
    if (!choiceSet.has(pad)) choiceSet.add(pad)
    pad++
  }

  return { text, answer, choices: Array.from(choiceSet).sort(() => Math.random() - 0.5) }
}

export default function MultiplicationDivisionGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()
  const [grade, setGrade] = useState<Grade | null>(null)
  const [qIndex, setQIndex] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [correct, setCorrect] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)

  const startGrade = (g: Grade) => {
    setGrade(g)
    setQIndex(0)
    setCorrect(0)
    setSelected(null)
    setQuestion(generateQuestion(g))
  }

  const handleAnswer = (choice: number) => {
    if (!question || selected !== null || !grade) return
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
        setQuestion(generateQuestion(grade))
        setSelected(null)
      }
    }, 900)
  }

  if (!grade) {
    return <DifficultySelector title="✖️ כפל וחילוק" subtitle="בחרו כיתה" options={GRADE_OPTIONS} onSelect={startGrade} />
  }

  if (!question) return null

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-3 flex items-center justify-between px-2 font-fun font-extrabold">
        <span className="rounded-full bg-grass-100 px-3 py-1 text-grass-600">
          {tr('score')}: {correct}
        </span>
        <span className="rounded-full bg-sunny-100 px-3 py-1 text-sunny-600">{GRADE_LABEL[grade]}</span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-600">
          {qIndex + 1} / {TOTAL_QUESTIONS}
        </span>
      </div>

      <div className="rounded-blob bg-white p-8 text-center shadow-pop card-outline">
        <div className="font-fun text-5xl font-extrabold text-ink" dir="ltr">
          {question.text}
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
              {c}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
