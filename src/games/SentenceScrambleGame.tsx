import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { LanguageGameProps } from './types'
import { sentencesByLevel } from '../data/sentences'
import { shuffle } from '../data/vocabulary'
import { useSound } from '../hooks/useSound'
import { useI18n } from '../i18n/LanguageContext'
import { LANG_META } from '../i18n/translations'
import FeedbackBubble from '../components/FeedbackBubble'
import ProgressBar from '../components/ProgressBar'
import Ltr from '../components/Ltr'

interface Chip {
  uid: string
  word: string
}

export default function SentenceScrambleGame({ lang, level, onFinish }: LanguageGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()
  const contentDir = LANG_META[lang].dir

  const sentences = useMemo(() => shuffle(sentencesByLevel(level)), [level])

  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [locked, setLocked] = useState(false)
  const [bank, setBank] = useState<Chip[]>([])
  const [answer, setAnswer] = useState<Chip[]>([])

  const current = sentences[index]

  useEffect(() => {
    if (!current) return
    const tokens = current.text[lang].map((word, i) => ({ uid: `${i}-${word}`, word }))
    setBank(shuffle(tokens))
    setAnswer([])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, current?.id])

  useEffect(() => {
    if (index >= sentences.length && sentences.length > 0) {
      onFinish({ correct, total: sentences.length })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  if (!current || index >= sentences.length) return null

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

  const checkAnswer = () => {
    if (locked || bank.length > 0) return
    setLocked(true)
    const isCorrect = answer.map((c) => c.word).join('|') === current.text[lang].join('|')
    if (isCorrect) {
      play('correct')
      setFeedback('correct')
      setCorrect((c) => c + 1)
    } else {
      play('wrong')
      setFeedback('wrong')
    }
    setTimeout(() => {
      setFeedback(null)
      setLocked(false)
      setIndex((i) => i + 1)
    }, 1200)
  }

  return (
    <div className="mx-auto max-w-lg">
      <FeedbackBubble status={feedback} />
      <div className="mb-4">
        <ProgressBar value={index} max={sentences.length} colorFrom="from-sky-400" colorTo="to-grass-400" />
        <p className="mt-1 text-center text-xs font-bold text-ink/50">
          <Ltr>{index + 1} / {sentences.length}</Ltr>
        </p>
      </div>

      <p className="mb-2 text-center text-sm font-bold text-ink/50">{tr('game_sentence_scramble_desc')}</p>

      <div dir={contentDir} className="mb-4 flex min-h-[64px] flex-wrap items-center gap-2 rounded-xl2 bg-white p-3 shadow-card card-outline">
        {answer.length === 0 && <span className="text-sm text-ink/30">...</span>}
        {answer.map((chip) => (
          <motion.button
            key={chip.uid}
            layout
            whileTap={{ scale: 0.9 }}
            onClick={() => removeFromAnswer(chip)}
            className="rounded-full bg-grape-500 px-3 py-2 font-fun font-bold text-white shadow-card"
          >
            {chip.word}
          </motion.button>
        ))}
      </div>

      <div dir={contentDir} className="mb-4 flex flex-wrap justify-center gap-2">
        {bank.map((chip) => (
          <motion.button
            key={chip.uid}
            layout
            whileTap={{ scale: 0.9 }}
            onClick={() => addToAnswer(chip)}
            className="rounded-full bg-white px-3 py-2 font-fun font-bold text-ink shadow-card card-outline btn-pressable"
          >
            {chip.word}
          </motion.button>
        ))}
      </div>

      <button
        onClick={checkAnswer}
        disabled={bank.length > 0 || locked}
        className="mx-auto block rounded-full bg-gradient-to-r from-grass-500 to-sky-500 px-8 py-3 font-fun font-extrabold text-white shadow-pop btn-pressable disabled:opacity-40"
      >
        {tr('submit')} ✅
      </button>
    </div>
  )
}
