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

const ITEMS: { emoji: string; name: string; price: number }[] = [
  { emoji: '🍎', name: 'תפוח', price: 3 },
  { emoji: '🍌', name: 'בננה', price: 2 },
  { emoji: '🥖', name: 'לחם', price: 6 },
  { emoji: '🧃', name: 'מיץ', price: 5 },
  { emoji: '🍫', name: 'שוקולד', price: 8 },
  { emoji: '🧀', name: 'גבינה', price: 12 },
  { emoji: '🥛', name: 'חלב', price: 7 },
  { emoji: '🍪', name: 'עוגייה', price: 4 },
]

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

interface Question {
  kind: 'total' | 'change'
  prompt: string
  items: typeof ITEMS
  choices: number[]
  answer: number
}

function buildChoices(answer: number): number[] {
  const choiceSet = new Set<number>([answer])
  let guard = 0
  while (choiceSet.size < 4 && guard < 30) {
    guard++
    const candidate = answer + rand(-6, 6)
    if (candidate >= 0 && !choiceSet.has(candidate)) choiceSet.add(candidate)
  }
  let pad = 0
  while (choiceSet.size < 4) {
    if (!choiceSet.has(pad)) choiceSet.add(pad)
    pad++
  }
  return shuffle(Array.from(choiceSet))
}

function generateQuestion(difficulty: Difficulty): Question {
  const itemCount = difficulty === 'easy' ? 2 : difficulty === 'medium' ? 3 : 4
  const items = shuffle(ITEMS).slice(0, itemCount)
  const total = items.reduce((sum, it) => sum + it.price, 0)

  if (difficulty !== 'hard' || Math.random() < 0.5) {
    return {
      kind: 'total',
      prompt: `כמה עולה לקנות ${items.map((it) => it.name).join(' + ')}?`,
      items,
      choices: buildChoices(total),
      answer: total,
    }
  }

  const paidOptions = [20, 30, 50, 100].filter((p) => p > total)
  const paid = paidOptions[rand(0, paidOptions.length - 1)] ?? total + 10
  const change = paid - total
  return {
    kind: 'change',
    prompt: `קניתם ${items.map((it) => it.name).join(' + ')} ושילמתם ${paid} ₪. כמה עודף תקבלו?`,
    items,
    choices: buildChoices(change),
    answer: change,
  }
}

export default function MoneyGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [qIndex, setQIndex] = useState(0)
  const [question, setQuestion] = useState<Question | null>(null)
  const [correct, setCorrect] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)

  const start = (d: Difficulty) => {
    setDifficulty(d)
    setQIndex(0)
    setCorrect(0)
    setSelected(null)
    setQuestion(generateQuestion(d))
  }

  const handleAnswer = (choice: number) => {
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
    return <DifficultySelector title="💰 כסף וקניות" subtitle="בחרו רמת קושי" options={DIFFICULTY_OPTIONS} onSelect={start} />
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
        <div className="mb-4 flex flex-wrap items-center justify-center gap-4">
          {question.items.map((it, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <span className="text-4xl">{it.emoji}</span>
              <span className="text-xs font-bold text-ink/60">
                <Ltr>{it.price} ₪</Ltr>
              </span>
            </div>
          ))}
        </div>
        <p className="font-fun text-lg font-extrabold text-ink">{question.prompt}</p>
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
              <Ltr>{c} ₪</Ltr>
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
