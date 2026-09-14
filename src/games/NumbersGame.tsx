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
const MAX_BY_DIFFICULTY: Record<Difficulty, number> = { easy: 20, medium: 60, hard: 200 }
const TOTAL_QUESTIONS = 10

interface Question {
  text: string
  choices: string[]
  answer: string
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function generateQuestion(difficulty: Difficulty): Question {
  const max = MAX_BY_DIFFICULTY[difficulty]
  const types = ['bigger', 'smaller', 'parity', 'next', 'prev', 'missing'] as const
  const type = types[rand(0, types.length - 1)]

  if (type === 'bigger' || type === 'smaller') {
    const a = rand(1, max)
    let b = rand(1, max)
    while (b === a) b = rand(1, max)
    const wantBigger = type === 'bigger'
    const answer = wantBigger ? Math.max(a, b) : Math.min(a, b)
    return {
      text: `איזה מספר ${wantBigger ? 'גדול' : 'קטן'} יותר: ${a} או ${b}?`,
      choices: shuffle([String(a), String(b)]),
      answer: String(answer),
    }
  }

  if (type === 'parity') {
    const n = rand(1, max)
    const isEven = n % 2 === 0
    return { text: `האם המספר ${n} זוגי או אי-זוגי?`, choices: shuffle(['זוגי', 'אי-זוגי']), answer: isEven ? 'זוגי' : 'אי-זוגי' }
  }

  if (type === 'next') {
    const n = rand(1, max - 1)
    return { text: `מהו המספר שבא אחרי ${n}?`, choices: buildNumberChoices(n + 1), answer: String(n + 1) }
  }

  if (type === 'prev') {
    const n = rand(2, max)
    return { text: `מהו המספר שבא לפני ${n}?`, choices: buildNumberChoices(n - 1), answer: String(n - 1) }
  }

  // missing: short consecutive sequence with one gap
  const start = rand(1, max - 4)
  const missingIdx = rand(1, 3)
  const seq = [start, start + 1, start + 2, start + 3, start + 4]
  const answer = seq[missingIdx]
  const display = seq.map((v, i) => (i === missingIdx ? '__' : String(v))).join(', ')
  return { text: `איזה מספר חסר? ${display}`, choices: buildNumberChoices(answer), answer: String(answer) }
}

function buildNumberChoices(answer: number): string[] {
  const choiceSet = new Set<number>([answer])
  let guard = 0
  while (choiceSet.size < 4 && guard < 30) {
    guard++
    const candidate = answer + rand(-4, 4)
    if (candidate > 0 && !choiceSet.has(candidate)) choiceSet.add(candidate)
  }
  let pad = 1
  while (choiceSet.size < 4) {
    if (!choiceSet.has(pad)) choiceSet.add(pad)
    pad++
  }
  return shuffle(Array.from(choiceSet).map(String))
}

export default function NumbersGame({ onFinish }: FunGameProps) {
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
    return <DifficultySelector title="🔢 מספרים" subtitle="בחרו רמת קושי" options={DIFFICULTY_OPTIONS} onSelect={start} />
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

      <div className="rounded-blob bg-white p-6 text-center shadow-pop card-outline sm:p-8">
        <div className="font-fun text-2xl font-extrabold text-ink sm:text-3xl">
          <Ltr>{question.text}</Ltr>
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
