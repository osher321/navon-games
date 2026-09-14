import { useState } from 'react'
import { motion } from 'framer-motion'
import type { FunGameProps } from './types'
import { useSound } from '../hooks/useSound'
import { useI18n } from '../i18n/LanguageContext'

type Grade = 'a' | 'b' | 'g'

interface GradeCfg {
  label: string
  icon: string
  maxNum: number
}

const GRADE_CFG: Record<Grade, GradeCfg> = {
  a: { label: 'כיתה א׳', icon: '🟢', maxNum: 10 },
  b: { label: 'כיתה ב׳', icon: '🟡', maxNum: 20 },
  g: { label: 'כיתה ג׳', icon: '🟠', maxNum: 100 },
}

const GRADE_ORDER: Grade[] = ['a', 'b', 'g']
const TOTAL_QUESTIONS = 10

interface Question {
  a: number
  b: number
  op: '+' | '-'
  answer: number
  choices: number[]
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

/** Numbers are always picked so the result stays within [0, maxNum] - young kids shouldn't hit negative results or answers bigger than the range they just practiced. */
function generateQuestion(grade: Grade): Question {
  const { maxNum } = GRADE_CFG[grade]
  const op: '+' | '-' = Math.random() < 0.5 ? '+' : '-'
  let a: number
  let b: number
  let answer: number

  if (op === '+') {
    a = rand(0, maxNum)
    b = rand(0, maxNum - a)
    answer = a + b
  } else {
    a = rand(0, maxNum)
    b = rand(0, a)
    answer = a - b
  }

  const choiceSet = new Set<number>([answer])
  let guard = 0
  while (choiceSet.size < 4 && guard < 30) {
    guard++
    const delta = rand(-5, 5)
    const candidate = answer + delta
    if (candidate >= 0 && !choiceSet.has(candidate)) choiceSet.add(candidate)
  }
  // Extremely small ranges (e.g. grade א׳ with answer 0) may not yield 4
  // distinct non-negative candidates from a +/-5 spread - pad with the next
  // free non-negative integers so there are always exactly 4 choices.
  let pad = 0
  while (choiceSet.size < 4) {
    if (!choiceSet.has(pad)) choiceSet.add(pad)
    pad++
  }

  const choices = Array.from(choiceSet).sort(() => Math.random() - 0.5)
  return { a, b, op, answer, choices }
}

export default function MathGame({ onFinish }: FunGameProps) {
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
    return (
      <div className="mx-auto max-w-lg text-center">
        <h2 className="mb-1 font-fun text-xl font-extrabold text-grape-600">{tr('game_math_name')}</h2>
        <p className="mb-5 text-ink/50">בחרו כיתה</p>
        <div className="flex flex-wrap justify-center gap-3">
          {GRADE_ORDER.map((g) => (
            <button
              key={g}
              onClick={() => startGrade(g)}
              className="flex min-w-[110px] flex-col items-center gap-1 rounded-xl2 bg-white px-4 py-3 font-fun font-extrabold text-ink shadow-card card-outline btn-pressable transition-all hover:-translate-y-0.5"
            >
              <span className="text-2xl">{GRADE_CFG[g].icon}</span>
              <span className="text-sm">{GRADE_CFG[g].label}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  if (!question) return null

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-3 flex items-center justify-between px-2 font-fun font-extrabold">
        <span className="rounded-full bg-grass-100 px-3 py-1 text-grass-600">
          {tr('score')}: {correct}
        </span>
        <span className="rounded-full bg-sunny-100 px-3 py-1 text-sunny-600">{GRADE_CFG[grade].label}</span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-600">
          {qIndex + 1} / {TOTAL_QUESTIONS}
        </span>
      </div>

      <div className="rounded-blob bg-white p-8 text-center shadow-pop card-outline">
        <div className="font-fun text-5xl font-extrabold text-ink" dir="ltr">
          {question.a} {question.op} {question.b} = ?
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
