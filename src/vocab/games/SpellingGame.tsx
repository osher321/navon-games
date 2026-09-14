import { useEffect, useRef, useState } from 'react'
import type { VocabGameProps } from './types'
import { useSound } from '../../hooks/useSound'
import FeedbackBubble from '../../components/FeedbackBubble'
import ProgressBar from '../../components/ProgressBar'
import Ltr from '../../components/Ltr'
import PronounceButton from '../ui/PronounceButton'

/** Shown the Hebrew meaning (and can listen to the English word as a hint), the learner types the English spelling. Comparison is trim + case-insensitive. */
export default function SpellingGame({ words, onAnswer, onFinish }: VocabGameProps) {
  const { play } = useSound()
  const [index, setIndex] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [value, setValue] = useState('')
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [revealed, setRevealed] = useState<string | null>(null)
  const [disabled, setDisabled] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const current = words[index]

  useEffect(() => {
    inputRef.current?.focus()
  }, [index])

  useEffect(() => {
    if (index >= words.length) onFinish({ correct: correctCount, total: words.length })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  if (!current || index >= words.length) return null

  const submit = () => {
    if (disabled || value.trim().length === 0) return
    setDisabled(true)
    const isCorrect = value.trim().toLowerCase() === current.en.trim().toLowerCase()
    onAnswer(current, isCorrect)
    if (isCorrect) {
      play('correct')
      setFeedback('correct')
      setCorrectCount((c) => c + 1)
    } else {
      play('wrong')
      setFeedback('wrong')
      setRevealed(current.en)
    }
    setTimeout(
      () => {
        setFeedback(null)
        setRevealed(null)
        setValue('')
        setDisabled(false)
        setIndex((i) => i + 1)
      },
      isCorrect ? 900 : 2200
    )
  }

  return (
    <div className="mx-auto max-w-md">
      <FeedbackBubble status={feedback} />
      <div className="mb-4">
        <ProgressBar value={index} max={words.length} colorFrom="from-grass-500" colorTo="to-sky-500" />
        <p className="mt-1 text-center text-xs font-bold text-ink/50">
          <Ltr>
            {index + 1} / {words.length}
          </Ltr>
        </p>
      </div>

      <div className="mb-6 rounded-blob bg-white p-6 text-center shadow-pop card-outline">
        <p className="text-xs font-bold text-ink/40">משמעות:</p>
        <div className="mt-1 font-fun text-2xl font-extrabold text-ink">{current.he}</div>
        <div className="mt-3 flex justify-center">
          <PronounceButton text={current.en} />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
        className="flex flex-col items-center gap-3"
      >
        <input
          ref={inputRef}
          type="text"
          dir="ltr"
          autoComplete="off"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          disabled={disabled}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-label="הקלידו את המילה באנגלית"
          placeholder="type the English word..."
          className="w-full rounded-xl2 border-2 border-ink/10 bg-white px-4 py-3 text-center font-fun text-xl font-extrabold text-ink shadow-card focus:border-grape-400 focus:outline-none disabled:opacity-70"
        />
        <button
          type="submit"
          disabled={disabled || value.trim().length === 0}
          className="rounded-full bg-grape-500 px-8 py-3 font-fun text-lg font-extrabold text-white shadow-card btn-pressable disabled:opacity-50"
        >
          שליחה
        </button>
      </form>

      {revealed && (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl2 bg-white/90 p-3 text-center shadow-card card-outline" role="status">
          <p className="text-sm font-extrabold text-ink">
            האיות הנכון: <Ltr className="text-grass-600">{revealed}</Ltr>
          </p>
          <PronounceButton text={revealed} size="sm" />
        </div>
      )}
    </div>
  )
}
