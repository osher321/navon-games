import { useState } from 'react'
import { motion } from 'framer-motion'
import type { FunGameProps } from './types'
import { useSound } from '../hooks/useSound'
import { useI18n } from '../i18n/LanguageContext'
import DifficultySelector from '../components/DifficultySelector'

interface Item {
  emoji: string
  label: string
}

const CATEGORIES: Record<string, Item[]> = {
  animals: [
    { emoji: '🐶', label: 'כלב' },
    { emoji: '🐱', label: 'חתול' },
    { emoji: '🐭', label: 'עכבר' },
    { emoji: '🐹', label: 'אוגר' },
    { emoji: '🐰', label: 'ארנב' },
    { emoji: '🦊', label: 'שועל' },
    { emoji: '🐻', label: 'דוב' },
    { emoji: '🐼', label: 'פנדה' },
  ],
  fruits: [
    { emoji: '🍎', label: 'תפוח' },
    { emoji: '🍌', label: 'בננה' },
    { emoji: '🍇', label: 'ענבים' },
    { emoji: '🍉', label: 'אבטיח' },
    { emoji: '🍓', label: 'תות' },
    { emoji: '🍒', label: 'דובדבן' },
    { emoji: '🍑', label: 'אפרסק' },
    { emoji: '🍋', label: 'לימון' },
  ],
  vehicles: [
    { emoji: '🚗', label: 'מכונית' },
    { emoji: '🚕', label: 'מונית' },
    { emoji: '🚌', label: 'אוטובוס' },
    { emoji: '🏎️', label: 'מכונית מירוץ' },
    { emoji: '🚓', label: 'ניידת משטרה' },
    { emoji: '🚑', label: 'אמבולנס' },
    { emoji: '🚒', label: 'מכבת אש' },
  ],
  vegetables: [
    { emoji: '🥕', label: 'גזר' },
    { emoji: '🥦', label: 'ברוקולי' },
    { emoji: '🥬', label: 'חסה' },
    { emoji: '🥒', label: 'מלפפון' },
    { emoji: '🌽', label: 'תירס' },
    { emoji: '🍅', label: 'עגבנייה' },
  ],
  sports: [
    { emoji: '⚽', label: 'כדורגל' },
    { emoji: '🏀', label: 'כדורסל' },
    { emoji: '🏈', label: 'פוטבול' },
    { emoji: '⚾', label: 'בייסבול' },
    { emoji: '🎾', label: 'טניס' },
    { emoji: '🏐', label: 'כדורעף' },
  ],
  sky: [
    { emoji: '☀️', label: 'שמש' },
    { emoji: '🌙', label: 'ירח' },
    { emoji: '⭐', label: 'כוכב' },
    { emoji: '☁️', label: 'ענן' },
    { emoji: '🌈', label: 'קשת' },
    { emoji: '⚡', label: 'ברק' },
  ],
  sea: [
    { emoji: '🐟', label: 'דג' },
    { emoji: '🐬', label: 'דולפין' },
    { emoji: '🐳', label: 'לוויתן' },
    { emoji: '🐙', label: 'תמנון' },
    { emoji: '🦀', label: 'סרטן' },
    { emoji: '🐠', label: 'דג טרופי' },
  ],
}

type Difficulty = 'easy' | 'medium' | 'hard'
const GROUP_SIZE: Record<Difficulty, number> = { easy: 3, medium: 4, hard: 5 }
const DIFFICULTY_OPTIONS: { id: Difficulty; icon: string; label: string }[] = [
  { id: 'easy', icon: '🟢', label: 'קל' },
  { id: 'medium', icon: '🟡', label: 'בינוני' },
  { id: 'hard', icon: '🔴', label: 'קשה' },
]

const TOTAL_QUESTIONS = 10

function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5)
}

function buildRound(difficulty: Difficulty) {
  const categoryNames = Object.keys(CATEGORIES)
  const [mainCat, oddCat] = shuffle(categoryNames).slice(0, 2)
  const groupSize = GROUP_SIZE[difficulty]
  const mainItems = shuffle(CATEGORIES[mainCat]).slice(0, groupSize)
  const oddItem = shuffle(CATEGORIES[oddCat])[0]
  const items = shuffle([...mainItems, oddItem])
  return { items, oddItem }
}

export default function OddOneOutGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()
  const [difficulty, setDifficulty] = useState<Difficulty | null>(null)
  const [qIndex, setQIndex] = useState(0)
  const [round, setRound] = useState<ReturnType<typeof buildRound> | null>(null)
  const [correct, setCorrect] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)

  const start = (d: Difficulty) => {
    setDifficulty(d)
    setQIndex(0)
    setCorrect(0)
    setSelected(null)
    setRound(buildRound(d))
  }

  const handleAnswer = (item: Item) => {
    if (!round || selected !== null || !difficulty) return
    setSelected(item.emoji)
    const isCorrect = item.emoji === round.oddItem.emoji
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
        setRound(buildRound(difficulty))
        setSelected(null)
      }
    }, 900)
  }

  if (!difficulty) {
    return <DifficultySelector title="❓ מה יוצא דופן?" subtitle="בחרו רמת קושי" options={DIFFICULTY_OPTIONS} onSelect={start} />
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

      <p className="mb-4 text-center font-fun text-lg font-extrabold text-ink">איזה פריט אינו שייך לקבוצה?</p>

      <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
        {round.items.map((item) => {
          const showState = selected !== null
          const isAnswer = item.emoji === round.oddItem.emoji
          const isSelectedWrong = selected === item.emoji && !isAnswer
          return (
            <motion.button
              key={item.emoji}
              whileTap={{ scale: 0.95 }}
              disabled={selected !== null}
              onClick={() => handleAnswer(item)}
              aria-label={item.label}
              className={`flex aspect-square flex-col items-center justify-center gap-1 rounded-xl2 text-3xl shadow-card card-outline btn-pressable transition-colors sm:text-4xl ${
                showState && isAnswer ? 'bg-grass-200' : showState && isSelectedWrong ? 'bg-candy-200' : 'bg-white'
              }`}
            >
              {item.emoji}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
