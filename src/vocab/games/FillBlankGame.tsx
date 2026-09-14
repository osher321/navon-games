import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { VocabGameProps } from './types'
import { shuffle } from '../data/words'
import { useSound } from '../../hooks/useSound'
import FeedbackBubble from '../../components/FeedbackBubble'
import ProgressBar from '../../components/ProgressBar'
import Ltr from '../../components/Ltr'
import PronounceButton from '../ui/PronounceButton'

/** Blanks the target word out of its own example sentence - the choices are other vocabulary words from this session, so it's testing "which word fits here" rather than grammar/conjugation. */
function blankSentence(example: string, word: string): string {
  const re = new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i')
  return example.replace(re, '_____')
}

export default function FillBlankGame({ words, onAnswer, onFinish }: VocabGameProps) {
  const { play } = useSound()
  const [index, setIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [disabled, setDisabled] = useState(false)

  const current = words[index]

  const options = useMemo(() => {
    if (!current) return []
    const distractors = shuffle(words.filter((w) => w.id !== current.id)).slice(0, 3)
    return shuffle([current, ...distractors])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id])

  useEffect(() => {
    if (index >= words.length) onFinish({ correct: correctCount, total: words.length })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  if (!current || index >= words.length) return null

  const sentence = blankSentence(current.example, current.en)

  const choose = (optId: string) => {
    if (disabled) return
    setDisabled(true)
    setPickedId(optId)
    const isCorrect = optId === current.id
    onAnswer(current, isCorrect)
    if (isCorrect) {
      play('correct')
      setFeedback('correct')
      setCorrectCount((c) => c + 1)
    } else {
      play('wrong')
      setFeedback('wrong')
    }
    setTimeout(
      () => {
        setFeedback(null)
        setPickedId(null)
        setDisabled(false)
        setIndex((i) => i + 1)
      },
      isCorrect ? 900 : 1800
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <FeedbackBubble status={feedback} />
      <div className="mb-4">
        <ProgressBar value={index} max={words.length} colorFrom="from-sunny-400" colorTo="to-candy-500" />
        <p className="mt-1 text-center text-xs font-bold text-ink/50">
          <Ltr>
            {index + 1} / {words.length}
          </Ltr>
        </p>
      </div>

      <div className="mb-6 rounded-blob bg-white p-6 text-center shadow-pop card-outline">
        <p className="text-lg font-bold text-ink">
          <Ltr>{sentence}</Ltr>
        </p>
        <p className="mt-2 text-xs font-bold text-ink/40">בחרו את המילה המתאימה</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const isThisCorrect = pickedId !== null && opt.id === current.id
          const isThisWrong = pickedId === opt.id && opt.id !== current.id
          return (
            // Flex pair, not a single button - so the pronounce control next
            // to each candidate word never nests inside the answer button.
            <div key={opt.id} className="flex items-center gap-1.5">
              <motion.button
                whileTap={{ scale: 0.96 }}
                disabled={disabled}
                onClick={() => choose(opt.id)}
                className={`flex-1 rounded-xl2 px-4 py-4 font-fun text-lg font-extrabold shadow-card card-outline btn-pressable disabled:opacity-90 ${
                  isThisCorrect ? 'bg-grass-400 text-white' : isThisWrong ? 'bg-candy-400 text-white' : 'bg-white text-grape-600'
                }`}
              >
                <Ltr>{opt.en}</Ltr>
              </motion.button>
              <PronounceButton text={opt.en} size="sm" />
            </div>
          )
        })}
      </div>
    </div>
  )
}
