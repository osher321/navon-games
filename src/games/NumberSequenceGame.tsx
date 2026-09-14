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

function generateSequence(difficulty: Difficulty): { sequence: number[]; answer: number } {
  if (difficulty === 'easy') {
    const start = rand(1, 10)
    const step = rand(1, 5)
    const seq = Array.from({ length: 5 }, (_, i) => start + i * step)
    return { sequence: seq.slice(0, 4), answer: seq[4] }
  }
  if (difficulty === 'medium') {
    if (Math.random() < 0.5) {
      const start = rand(1, 20)
      const step = rand(2, 8)
      const seq = Array.from({ length: 5 }, (_, i) => start + i * step)
      return { sequence: seq.slice(0, 4), answer: seq[4] }
    }
    const start = rand(1, 5)
    const ratio = rand(2, 3)
    const seq = Array.from({ length: 5 }, (_, i) => start * Math.pow(ratio, i))
    return { sequence: seq.slice(0, 4), answer: seq[4] }
  }
  const pattern = rand(0, 2)
  if (pattern === 0) {
    const start = rand(1, 15)
    const a = rand(2, 6)
    const b = rand(2, 6)
    const seq = [start]
    for (let i = 0; i < 5; i++) seq.push(seq[seq.length - 1] + (i % 2 === 0 ? a : b))
    return { sequence: seq.slice(0, 5), answer: seq[5] }
  }
  if (pattern === 1) {
    const start = rand(50, 100)
    const step = rand(3, 9)
    const seq = Array.from({ length: 6 }, (_, i) => start - i * step)
    return { sequence: seq.slice(0, 5), answer: seq[5] }
  }
  const start = rand(1, 4)
  const ratio = rand(2, 3)
  const seq = Array.from({ length: 5 }, (_, i) => start * Math.pow(ratio, i))
  return { sequence: seq.slice(0, 4), answer: seq[4] }
}

function buildChoices(answer: number): number[] {
  const choiceSet = new Set<number>([answer])
  let guard = 0
  while (choiceSet.size < 4 && guard < 30) {
    guard++
    const delta = rand(-6, 6) || 1
    const candidate = answer + delta
    if (candidate >= 0 && !choiceSet.has(candidate)) choiceSet.add(candidate)
  }
  let pad = 0
  while (choiceSet.size < 4) {
    if (!choiceSet.has(pad)) choiceSet.add(pad)
    pad++
  }
  return Array.from(choiceSet).sort(() => Math.random() - 0.5)
}

export default function NumberSequenceGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [qIndex, setQIndex] = useState(0)
  const [round, setRound] = useState<{ sequence: number[]; answer: number; choices: number[] } | null>(null)
  const [correct, setCorrect] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)

  const nextRound = (d: Difficulty) => {
    const gen = generateSequence(d)
    setRound({ ...gen, choices: buildChoices(gen.answer) })
  }

  const start = (d: Difficulty) => {
    setDifficulty(d)
    setQIndex(0)
    setCorrect(0)
    setSelected(null)
    nextRound(d)
  }

  const handleAnswer = (choice: number) => {
    if (!round || selected !== null || !difficulty) return
    setSelected(choice)
    const isCorrect = choice === round.answer
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
        nextRound(difficulty)
        setSelected(null)
      }
    }, 900)
  }

  if (!difficulty) {
    return <DifficultySelector title="🔢 רצפים" subtitle="בחרו רמת קושי" options={DIFFICULTY_OPTIONS} onSelect={start} />
  }

  if (!round) return null

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
        <p className="mb-3 text-sm font-bold text-ink/50">מה המספר הבא ברצף?</p>
        <div className="font-fun text-3xl font-extrabold text-ink sm:text-4xl" dir="ltr">
          <Ltr>{round.sequence.join(' , ')} , ?</Ltr>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {round.choices.map((c) => {
          const showState = selected !== null
          const isAnswer = c === round.answer
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
