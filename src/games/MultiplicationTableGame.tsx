import { useState } from 'react'
import { motion } from 'framer-motion'
import type { FunGameProps } from './types'
import { useSound } from '../hooks/useSound'
import { useI18n } from '../i18n/LanguageContext'

const TABLES = Array.from({ length: 10 }, (_, i) => i + 1)
const QUESTIONS_PER_ROUND = 10

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function buildQuestion(table: number) {
  const multiplier = rand(1, 10)
  const answer = table * multiplier
  const choiceSet = new Set<number>([answer])
  let guard = 0
  while (choiceSet.size < 4 && guard < 30) {
    guard++
    const candidate = answer + rand(-3, 3) * table
    if (candidate > 0 && !choiceSet.has(candidate)) choiceSet.add(candidate)
  }
  let pad = table
  while (choiceSet.size < 4) {
    if (!choiceSet.has(pad)) choiceSet.add(pad)
    pad += table
  }
  return { multiplier, answer, choices: Array.from(choiceSet).sort(() => Math.random() - 0.5) }
}

export default function MultiplicationTableGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()
  const [table, setTable] = useState<number | null>(null)
  const [qIndex, setQIndex] = useState(0)
  const [question, setQuestion] = useState<ReturnType<typeof buildQuestion> | null>(null)
  const [correct, setCorrect] = useState(0)
  const [streak, setStreak] = useState(0)
  const [bestStreak, setBestStreak] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)

  const startTable = (t: number) => {
    setTable(t)
    setQIndex(0)
    setCorrect(0)
    setStreak(0)
    setBestStreak(0)
    setSelected(null)
    setQuestion(buildQuestion(t))
  }

  const handleAnswer = (choice: number) => {
    if (!question || selected !== null || !table) return
    setSelected(choice)
    const isCorrect = choice === question.answer
    const nextCorrect = isCorrect ? correct + 1 : correct
    const nextStreak = isCorrect ? streak + 1 : 0
    setStreak(nextStreak)
    setBestStreak((b) => Math.max(b, nextStreak))
    if (isCorrect) {
      setCorrect(nextCorrect)
      play('correct')
    } else {
      play('wrong')
    }
    window.setTimeout(() => {
      if (qIndex + 1 >= QUESTIONS_PER_ROUND) {
        onFinish({ correct: nextCorrect, total: QUESTIONS_PER_ROUND })
      } else {
        setQIndex((i) => i + 1)
        setQuestion(buildQuestion(table))
        setSelected(null)
      }
    }, 800)
  }

  if (!table) {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h2 className="mb-1 font-fun text-xl font-extrabold text-grape-600">🔢 לוח הכפל</h2>
        <p className="mb-5 text-ink/50">בחרו לוח לתרגול</p>
        <div className="flex flex-wrap justify-center gap-2">
          {TABLES.map((t) => (
            <button
              key={t}
              onClick={() => startTable(t)}
              className="grid h-14 w-14 place-items-center rounded-xl2 bg-white font-fun text-xl font-extrabold text-ink shadow-card card-outline btn-pressable transition-all hover:-translate-y-0.5"
            >
              {t}
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
        <span className="rounded-full bg-sunny-100 px-3 py-1 text-sunny-600">🔥 {streak}</span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-600">
          {qIndex + 1} / {QUESTIONS_PER_ROUND}
        </span>
      </div>

      <div className="rounded-blob bg-white p-8 text-center shadow-pop card-outline">
        <div className="font-fun text-5xl font-extrabold text-ink" dir="ltr">
          {table} × {question.multiplier} = ?
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
