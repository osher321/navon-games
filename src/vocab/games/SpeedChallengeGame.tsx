import { useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { VocabGameProps } from './types'
import { pickDistractors, shuffle } from '../data/words'
import { useSound } from '../../hooks/useSound'
import Ltr from '../../components/Ltr'

const DURATION_SEC = 60

/** 60 seconds, as many quick translation questions as possible. The word pool loops (reshuffled) if it runs out before the timer does, so a strong player is never blocked on content. */
export default function SpeedChallengeGame({ words, onAnswer, onFinish }: VocabGameProps) {
  const { play } = useSound()
  const [queue, setQueue] = useState(() => shuffle(words))
  const [qIndex, setQIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [remaining, setRemaining] = useState(DURATION_SEC)
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [disabled, setDisabled] = useState(false)
  const finishedRef = useRef(false)

  const current = queue[qIndex % queue.length]

  const options = useMemo(() => {
    if (!current) return []
    const distractors = pickDistractors(words, current.id, 3)
    return shuffle([current, ...distractors])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, qIndex])

  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((r) => {
        if (r <= 1) {
          clearInterval(timer)
          return 0
        }
        return r - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (remaining === 0 && !finishedRef.current) {
      finishedRef.current = true
      onFinish({ correct: correctCount, total: answeredCount, elapsedSec: DURATION_SEC })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [remaining])

  if (words.length === 0 || remaining === 0) return null

  const choose = (optId: string) => {
    if (disabled) return
    setDisabled(true)
    setPickedId(optId)
    const isCorrect = optId === current.id
    onAnswer(current, isCorrect, 'speed')
    setAnsweredCount((c) => c + 1)
    if (isCorrect) {
      play('correct')
      setCorrectCount((c) => c + 1)
    } else {
      play('wrong')
    }
    setTimeout(() => {
      setPickedId(null)
      setDisabled(false)
      setQIndex((i) => {
        const next = i + 1
        // Reshuffle once a full lap of the pool completes, so a long run
        // doesn't repeat the exact same order every 36 questions.
        if (next > 0 && next % queue.length === 0) setQueue(shuffle(words))
        return next
      })
    }, 350)
  }

  return (
    <div className="mx-auto max-w-md">
      <div className="mb-4 flex items-center justify-between rounded-full bg-white px-4 py-2 shadow-card card-outline">
        <span className={`font-fun text-sm font-extrabold ${remaining <= 10 ? 'text-candy-600' : 'text-ink'}`}>
          ⏱️ <Ltr>{remaining}</Ltr>s
        </span>
        <span className="font-fun text-sm font-extrabold text-grass-600">
          ⭐ <Ltr>{correctCount}</Ltr>
        </span>
      </div>

      <div className="mb-6 rounded-blob bg-white p-6 text-center shadow-pop card-outline">
        <div className="font-fun text-3xl font-extrabold text-ink">
          <Ltr>{current.en}</Ltr>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => {
          const isThisCorrect = pickedId !== null && opt.id === current.id
          const isThisWrong = pickedId === opt.id && opt.id !== current.id
          return (
            <motion.button
              key={`${qIndex}-${opt.id}`}
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
    </div>
  )
}
