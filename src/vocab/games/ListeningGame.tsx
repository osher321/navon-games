import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { VocabGameProps } from './types'
import { shuffle } from '../data/words'
import { useSound } from '../../hooks/useSound'
import FeedbackBubble from '../../components/FeedbackBubble'
import ProgressBar from '../../components/ProgressBar'
import Ltr from '../../components/Ltr'
import PronounceButton from '../ui/PronounceButton'

/** Hear the word, pick it from 4 written options. Falls back to just showing the word if Text-to-Speech isn't available in this browser - never a dead end. */
export default function ListeningGame({ words, onAnswer, onFinish, speak, canSpeak }: VocabGameProps) {
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
    if (current && canSpeak) speak(current.en)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, canSpeak])

  useEffect(() => {
    if (index >= words.length) onFinish({ correct: correctCount, total: words.length })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  if (!current || index >= words.length) return null

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
        <ProgressBar value={index} max={words.length} colorFrom="from-grape-400" colorTo="to-candy-400" />
        <p className="mt-1 text-center text-xs font-bold text-ink/50">
          <Ltr>
            {index + 1} / {words.length}
          </Ltr>
        </p>
      </div>

      <div className="mb-6 rounded-blob bg-white p-6 text-center shadow-pop card-outline">
        {canSpeak ? (
          <>
            <div className="flex justify-center">
              <PronounceButton text={current.en} variant="circle" />
            </div>
            <p className="mt-3 text-xs font-bold text-ink/40">הקשיבו ובחרו את המילה הנכונה</p>
          </>
        ) : (
          <>
            <div className="font-fun text-3xl font-extrabold text-ink">
              <Ltr>{current.en}</Ltr>
            </div>
            <p className="mt-2 text-xs font-bold text-ink/40">🔇 הקראה אינה זמינה בדפדפן זה - בחרו את המילה שמופיעה למעלה</p>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const isThisCorrect = pickedId !== null && opt.id === current.id
          const isThisWrong = pickedId === opt.id && opt.id !== current.id
          return (
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
