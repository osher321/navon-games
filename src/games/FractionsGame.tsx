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

/** A shaded pie chart built from a single conic-gradient - no image assets needed. */
function PieVisual({ numerator, denominator, size = 140 }: { numerator: number; denominator: number; size?: number }) {
  const pct = (numerator / denominator) * 100
  return (
    <div
      className="mx-auto rounded-full border-4 border-ink/10"
      style={{
        width: size,
        height: size,
        background: `conic-gradient(#7226f5 0% ${pct}%, #ffffff ${pct}% 100%)`,
      }}
      role="img"
      aria-label={`שבר: ${numerator} מתוך ${denominator}`}
    />
  )
}

interface Question {
  kind: 'identify' | 'compare' | 'numerator' | 'denominator'
  prompt: string
  visual?: { numerator: number; denominator: number }
  compareVisuals?: [{ numerator: number; denominator: number }, { numerator: number; denominator: number }]
  choices: string[]
  answer: string
}

function fracStr(n: number, d: number) {
  return `${n}/${d}`
}

function generateQuestion(difficulty: Difficulty): Question {
  const kinds: Question['kind'][] =
    difficulty === 'easy' ? ['identify', 'identify', 'numerator'] : difficulty === 'medium' ? ['identify', 'compare', 'denominator'] : ['compare', 'numerator', 'denominator']
  const kind = kinds[rand(0, kinds.length - 1)]
  const maxD = difficulty === 'easy' ? 6 : difficulty === 'medium' ? 8 : 12

  if (kind === 'identify') {
    const d = rand(2, maxD)
    const n = rand(1, d - 1)
    const answer = fracStr(n, d)
    const choiceSet = new Set<string>([answer])
    let guard = 0
    while (choiceSet.size < 4 && guard < 30) {
      guard++
      const cn = rand(1, d - 1)
      if (!choiceSet.has(fracStr(cn, d))) choiceSet.add(fracStr(cn, d))
    }
    return { kind, prompt: 'איזה שבר מתאים לציור?', visual: { numerator: n, denominator: d }, choices: shuffle(Array.from(choiceSet)), answer }
  }

  if (kind === 'numerator' || kind === 'denominator') {
    const d = rand(2, maxD)
    const n = rand(1, d - 1)
    const answer = kind === 'numerator' ? n : d
    const label = kind === 'numerator' ? 'המונה' : 'המכנה'
    const choiceSet = new Set<number>([answer])
    let guard = 0
    while (choiceSet.size < 4 && guard < 30) {
      guard++
      const candidate = answer + rand(-3, 3)
      if (candidate > 0 && !choiceSet.has(candidate)) choiceSet.add(candidate)
    }
    let pad = 1
    while (choiceSet.size < 4) {
      if (!choiceSet.has(pad)) choiceSet.add(pad)
      pad++
    }
    return {
      kind,
      prompt: `בשבר ${fracStr(n, d)}, מהו ${label}?`,
      choices: shuffle(Array.from(choiceSet).map(String)),
      answer: String(answer),
    }
  }

  // compare
  let d1 = rand(2, maxD)
  let n1 = rand(1, d1 - 1)
  let d2 = rand(2, maxD)
  let n2 = rand(1, d2 - 1)
  // avoid equal-value fractions to keep the question unambiguous
  let guard = 0
  while (n1 / d1 === n2 / d2 && guard < 20) {
    guard++
    d2 = rand(2, maxD)
    n2 = rand(1, d2 - 1)
  }
  const aBigger = n1 / d1 > n2 / d2
  const answer = aBigger ? fracStr(n1, d1) : fracStr(n2, d2)
  return {
    kind,
    prompt: 'איזה שבר גדול יותר?',
    compareVisuals: [
      { numerator: n1, denominator: d1 },
      { numerator: n2, denominator: d2 },
    ],
    choices: shuffle([fracStr(n1, d1), fracStr(n2, d2)]),
    answer,
  }
}

export default function FractionsGame({ onFinish }: FunGameProps) {
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
    return <DifficultySelector title="🍕 שברים" subtitle="בחרו רמת קושי" options={DIFFICULTY_OPTIONS} onSelect={start} />
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
        <p className="mb-4 font-fun text-lg font-extrabold text-ink">{question.prompt}</p>
        {question.visual && <PieVisual {...question.visual} />}
        {question.compareVisuals && (
          <div className="flex items-center justify-center gap-8">
            <div>
              <PieVisual {...question.compareVisuals[0]} size={110} />
              <p className="mt-2 font-fun font-bold text-ink/60">
                <Ltr>{fracStr(question.compareVisuals[0].numerator, question.compareVisuals[0].denominator)}</Ltr>
              </p>
            </div>
            <div>
              <PieVisual {...question.compareVisuals[1]} size={110} />
              <p className="mt-2 font-fun font-bold text-ink/60">
                <Ltr>{fracStr(question.compareVisuals[1].numerator, question.compareVisuals[1].denominator)}</Ltr>
              </p>
            </div>
          </div>
        )}
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
