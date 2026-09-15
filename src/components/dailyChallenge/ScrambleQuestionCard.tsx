import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import type { ScrambleQuestion } from '../../data/dailyChallenge/types'
import { QUESTION_KIND_META } from '../../data/dailyChallenge/types'
import { shuffle } from '../../data/vocabulary'
import { useSound } from '../../hooks/useSound'
import { useI18n } from '../../i18n/LanguageContext'
import { LANG_META } from '../../i18n/translations'

interface Chip {
  uid: string
  word: string
}

export default function ScrambleQuestionCard({ question, onAnswer }: { question: ScrambleQuestion; onAnswer: (correct: boolean) => void }) {
  const { play } = useSound()
  const { tr } = useI18n()
  const meta = QUESTION_KIND_META[question.kind]
  const referenceLang = question.lang === 'he' ? 'en' : 'he'
  const promptDir = LANG_META[referenceLang].dir
  const tokensDir = LANG_META[question.lang].dir

  const [bank, setBank] = useState<Chip[]>([])
  const [answer, setAnswer] = useState<Chip[]>([])
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    const tokens = question.tokens.map((word, i) => ({ uid: `${i}-${word}`, word }))
    setBank(shuffle(tokens))
    setAnswer([])
    setLocked(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id])

  const addToAnswer = (chip: Chip) => {
    if (locked) return
    setBank((b) => b.filter((c) => c.uid !== chip.uid))
    setAnswer((a) => [...a, chip])
  }

  const removeFromAnswer = (chip: Chip) => {
    if (locked) return
    setAnswer((a) => a.filter((c) => c.uid !== chip.uid))
    setBank((b) => [...b, chip])
  }

  const check = () => {
    if (locked || bank.length > 0) return
    setLocked(true)
    const isCorrect = answer.map((c) => c.word).join('|') === question.correctOrder.join('|')
    play(isCorrect ? 'correct' : 'wrong')
    setTimeout(() => onAnswer(isCorrect), 1000)
  }

  return (
    <div className="mx-auto max-w-lg">
      <p className="mb-3 text-center text-xs font-bold text-ink/40">
        {meta.icon} {tr(meta.labelKey)}
      </p>

      {question.promptText && (
        <div dir={promptDir} className="mb-4 rounded-blob bg-white p-4 text-center font-fun text-lg font-bold text-ink shadow-pop card-outline">
          {question.promptText}
        </div>
      )}

      <div dir={tokensDir} className="mb-4 flex min-h-[64px] flex-wrap items-center gap-2 rounded-xl2 bg-white p-3 shadow-card card-outline">
        {answer.length === 0 && <span className="text-sm text-ink/30">...</span>}
        {answer.map((chip) => (
          <motion.button
            key={chip.uid}
            layout
            whileTap={{ scale: 0.9 }}
            disabled={locked}
            onClick={() => removeFromAnswer(chip)}
            className="rounded-full bg-grape-500 px-3 py-2 font-fun font-bold text-white shadow-card"
          >
            {chip.word}
          </motion.button>
        ))}
      </div>

      <div dir={tokensDir} className="mb-4 flex flex-wrap justify-center gap-2">
        {bank.map((chip) => (
          <motion.button
            key={chip.uid}
            layout
            whileTap={{ scale: 0.9 }}
            disabled={locked}
            onClick={() => addToAnswer(chip)}
            className="rounded-full bg-white px-3 py-2 font-fun font-bold text-ink shadow-card card-outline btn-pressable"
          >
            {chip.word}
          </motion.button>
        ))}
      </div>

      <button
        onClick={check}
        disabled={bank.length > 0 || locked}
        className="mx-auto block rounded-full bg-gradient-to-r from-grass-500 to-sky-500 px-8 py-3 font-fun font-extrabold text-white shadow-pop btn-pressable disabled:opacity-40"
      >
        בדקו ✅
      </button>
    </div>
  )
}
