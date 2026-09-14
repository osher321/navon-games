import { useState } from 'react'
import { motion } from 'framer-motion'
import type { FunGameProps } from './types'
import { useSound } from '../hooks/useSound'
import { useI18n } from '../i18n/LanguageContext'
import DifficultySelector from '../components/DifficultySelector'

type Difficulty = 'easy' | 'medium' | 'hard'
const DIFFICULTY_OPTIONS: { id: Difficulty; icon: string; label: string }[] = [
  { id: 'easy', icon: '🟢', label: 'קל' },
  { id: 'medium', icon: '🟡', label: 'בינוני' },
  { id: 'hard', icon: '🔴', label: 'קשה' },
]
const TOTAL_QUESTIONS = 10

const NAMES: { name: string; gender: 'm' | 'f' }[] = [
  { name: 'דני', gender: 'm' },
  { name: 'נועה', gender: 'f' },
  { name: 'איתן', gender: 'm' },
  { name: 'מיכל', gender: 'f' },
  { name: 'יובל', gender: 'm' },
  { name: 'שירה', gender: 'f' },
]
const OBJECTS = ['תפוחים', 'עפרונות', 'מדבקות', 'בלונים', 'ספרים', 'כדורים']

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}
function pick<T>(arr: T[]): T {
  return arr[rand(0, arr.length - 1)]
}
function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}
function buildChoices(answer: number): number[] {
  const choiceSet = new Set<number>([answer])
  let guard = 0
  while (choiceSet.size < 4 && guard < 30) {
    guard++
    const candidate = answer + rand(-5, 5)
    if (candidate >= 0 && !choiceSet.has(candidate)) choiceSet.add(candidate)
  }
  let pad = 0
  while (choiceSet.size < 4) {
    if (!choiceSet.has(pad)) choiceSet.add(pad)
    pad++
  }
  return shuffle(Array.from(choiceSet))
}

function generateProblem(difficulty: Difficulty): { text: string; answer: number; choices: number[] } {
  const max = difficulty === 'easy' ? 12 : difficulty === 'medium' ? 25 : 50
  const person = pick(NAMES)
  const obj = pick(OBJECTS)
  const ops = difficulty === 'easy' ? ['add', 'sub'] : difficulty === 'medium' ? ['add', 'sub', 'mul'] : ['add', 'sub', 'mul', 'div']
  const op = pick(ops)

  if (op === 'add') {
    const a = rand(1, max)
    const b = rand(1, max)
    const verb = person.gender === 'm' ? 'קיבל' : 'קיבלה'
    return { text: `ל${person.name} היו ${a} ${obj}. ${person.name} ${verb} עוד ${b} ${obj}. כמה ${obj} יש ל${person.name} עכשיו?`, answer: a + b, choices: buildChoices(a + b) }
  }
  if (op === 'sub') {
    const a = rand(5, max)
    const b = rand(1, a - 1)
    const verb = person.gender === 'm' ? 'נתן' : 'נתנה'
    return { text: `ל${person.name} היו ${a} ${obj}. ${person.name} ${verb} ${b} ${obj} לחבר. כמה ${obj} נשארו ל${person.name}?`, answer: a - b, choices: buildChoices(a - b) }
  }
  if (op === 'mul') {
    const a = rand(2, 6)
    const b = rand(2, 8)
    return {
      text: `ל${person.name} יש ${a} קופסאות, ובכל קופסה ${b} ${obj}. כמה ${obj} יש ל${person.name} בסך הכל?`,
      answer: a * b,
      choices: buildChoices(a * b),
    }
  }
  // division - always exact
  const groups = rand(2, 6)
  const perGroup = rand(2, 8)
  const total = groups * perGroup
  const pronoun = person.gender === 'm' ? 'הוא' : 'היא'
  return {
    text: `ל${person.name} יש ${total} ${obj}, ו${pronoun} מחלק/ת אותם שווה בשווה בין ${groups} חברים. כמה ${obj} מקבל כל חבר?`,
    answer: perGroup,
    choices: buildChoices(perGroup),
  }
}

export default function WordProblemsGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [qIndex, setQIndex] = useState(0)
  const [problem, setProblem] = useState<ReturnType<typeof generateProblem> | null>(null)
  const [correct, setCorrect] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)

  const start = (d: Difficulty) => {
    setDifficulty(d)
    setQIndex(0)
    setCorrect(0)
    setSelected(null)
    setProblem(generateProblem(d))
  }

  const handleAnswer = (choice: number) => {
    if (!problem || selected !== null || !difficulty) return
    setSelected(choice)
    const isCorrect = choice === problem.answer
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
        setProblem(generateProblem(difficulty))
        setSelected(null)
      }
    }, 1000)
  }

  if (!difficulty) {
    return <DifficultySelector title="📖 בעיות מילוליות" subtitle="בחרו רמת קושי" options={DIFFICULTY_OPTIONS} onSelect={start} />
  }
  if (!problem) return null

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
        <p className="font-fun text-lg font-extrabold leading-relaxed text-ink">{problem.text}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        {problem.choices.map((c) => {
          const showState = selected !== null
          const isAnswer = c === problem.answer
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
