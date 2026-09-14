import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { VocabGameProps } from './types'
import { pickDistractors, shuffle } from '../data/words'
import { useSound } from '../../hooks/useSound'
import FeedbackBubble from '../../components/FeedbackBubble'
import ProgressBar from '../../components/ProgressBar'
import Ltr from '../../components/Ltr'
import PronounceButton from '../ui/PronounceButton'

/** English word on screen, pick the correct Hebrew meaning - the flagship "translate this word" exercise. */
export default function MultipleChoiceGame({ words, onAnswer, onFinish }: VocabGameProps) {
  const { play } = useSound()
  const [index, setIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [disabled, setDisabled] = useState(false)

  const current = words[index]

  const options = useMemo(() => {
    if (!current) return []
    const distractors = pickDistractors(words, current.id, 3)
    return shuffle([current, ...distractors])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id])

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
      isCorrect ? 900 : 2200
    )
  }

  const wrongPicked = pickedId && pickedId !== current.id

  return (
    <div className="mx-auto max-w-md">
      <FeedbackBubble status={feedback} />
      <div className="mb-4">
        <ProgressBar value={index} max={words.length} colorFrom="from-sky-500" colorTo="to-grape-500" />
        <p className="mt-1 text-center text-xs font-bold text-ink/50">
          <Ltr>
            {index + 1} / {words.length}
          </Ltr>
        </p>
      </div>

      <div className="mb-6 rounded-blob bg-white p-6 text-center shadow-pop card-outline">
        <div className="font-fun text-3xl font-extrabold text-ink">
          <Ltr>{current.en}</Ltr>
        </div>
        <div className="mt-3 flex justify-center">
          <PronounceButton text={current.en} />
        </div>
        <p className="mt-2 text-xs font-bold text-ink/40">בחרו את התרגום הנכון</p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {options.map((opt) => {
          const isThisCorrect = pickedId !== null && opt.id === current.id
          const isThisWrong = pickedId === opt.id && opt.id !== current.id
          return (
            <motion.button
              key={opt.id}
              whileTap={{ scale: 0.96 }}
              disabled={disabled}
              onClick={() => choose(opt.id)}
              className={`rounded-xl2 px-4 py-4 font-fun text-lg font-extrabold shadow-card card-outline btn-pressable disabled:opacity-90 ${
                isThisCorrect ? 'bg-grass-400 text-white' : isThisWrong ? 'bg-candy-400 text-white' : 'bg-white text-grape-600'
              }`}
            >
              {opt.he}
            </motion.button>
          )
        })}
      </div>

      {wrongPicked && (
        <div className="mt-4 rounded-xl2 bg-white/90 p-3 text-center shadow-card card-outline" role="status">
          <p className="text-sm font-extrabold text-ink">
            התשובה הנכונה: <span className="text-grass-600">{current.he}</span>
          </p>
          <p className="mt-1 text-xs text-ink/60">
            <Ltr>{current.example}</Ltr>
          </p>
        </div>
      )}
    </div>
  )
}
