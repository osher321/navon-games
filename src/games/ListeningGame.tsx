import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { LanguageGameProps } from './types'
import { vocabByLevelAndLang, pickDistractors, shuffle, vocabById } from '../data/vocabulary'
import { useProgress } from '../hooks/useProgress'
import { useSound } from '../hooks/useSound'
import { useSpeech } from '../hooks/useSpeech'
import { useI18n } from '../i18n/LanguageContext'
import FeedbackBubble from '../components/FeedbackBubble'
import ProgressBar from '../components/ProgressBar'
import Ltr from '../components/Ltr'

const ROUND_SIZE = 8

export default function ListeningGame({ lang, level, onFinish }: LanguageGameProps) {
  const { tr } = useI18n()
  const { getAdaptiveWords } = useProgress()
  const { play } = useSound()
  const { speak, supported, canSpeak } = useSpeech()
  const referenceLang = lang === 'he' ? 'en' : 'he'
  const [voiceOk, setVoiceOk] = useState(true)

  const pool = useMemo(() => vocabByLevelAndLang(level), [level])
  const wordIds = useMemo(() => {
    const ids = getAdaptiveWords(lang, level, pool.map((v) => v.id), Math.min(ROUND_SIZE, pool.length))
    return ids.length ? ids : pool.slice(0, ROUND_SIZE).map((v) => v.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, pool])

  const [index, setIndex] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [missed, setMissed] = useState<string[]>([])
  const [learned, setLearned] = useState<string[]>([])
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [disabled, setDisabled] = useState(false)

  const currentId = wordIds[index]
  const current = vocabById(currentId)

  const options = useMemo(() => {
    if (!current) return []
    const distractors = pickDistractors(pool, current.id, 3)
    return shuffle([current, ...distractors])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  useEffect(() => {
    if (current) speak(current.text[lang], lang)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentId])

  useEffect(() => {
    // voices can load asynchronously, so re-check a couple of times after mount
    let alive = true
    const check = () => alive && setVoiceOk(canSpeak(lang))
    check()
    const t1 = setTimeout(check, 400)
    const t2 = setTimeout(check, 1500)
    return () => {
      alive = false
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [lang, canSpeak])

  useEffect(() => {
    if (index >= wordIds.length) {
      onFinish({ correct, total: wordIds.length, missedWordIds: missed, learnedWordIds: learned })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index])

  if (!current || index >= wordIds.length) return null

  const choose = (optId: string) => {
    if (disabled) return
    setDisabled(true)
    const isCorrect = optId === current.id
    if (isCorrect) {
      play('correct')
      setFeedback('correct')
      setCorrect((c) => c + 1)
      setLearned((l) => [...l, current.id])
    } else {
      play('wrong')
      setFeedback('wrong')
      setMissed((m) => [...m, current.id])
    }
    setTimeout(() => {
      setFeedback(null)
      setDisabled(false)
      setIndex((i) => i + 1)
    }, 900)
  }

  return (
    <div className="mx-auto max-w-md">
      <FeedbackBubble status={feedback} />
      <div className="mb-4">
        <ProgressBar value={index} max={wordIds.length} colorFrom="from-grape-400" colorTo="to-candy-400" />
        <p className="mt-1 text-center text-xs font-bold text-ink/50">
          <Ltr>{index + 1} / {wordIds.length}</Ltr>
        </p>
      </div>

      <div className="mb-6 grid place-items-center">
        <motion.button
          key={current.id}
          onClick={() => speak(current.text[lang], lang)}
          whileTap={{ scale: 0.9 }}
          animate={{ scale: [1, 1.06, 1] }}
          transition={{ repeat: Infinity, duration: 1.8 }}
          className="grid h-32 w-32 place-items-center rounded-full bg-gradient-to-br from-grape-500 to-candy-500 text-6xl text-white shadow-pop"
        >
          🔊
        </motion.button>
        {(!supported || !voiceOk) && (
          <p className="mt-2 text-center text-xs text-ink/40">({tr('listen')}: {current.text[lang]})</p>
        )}
        <p className="mt-2 text-sm font-bold text-ink/50">{tr('select_translation')}</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {options.map((opt) => (
          <motion.button
            key={opt.id}
            whileTap={{ scale: 0.95 }}
            disabled={disabled}
            onClick={() => choose(opt.id)}
            className="rounded-xl2 bg-white px-4 py-4 font-fun text-lg font-extrabold text-sky-600 shadow-card card-outline btn-pressable disabled:opacity-70"
          >
            {opt.emoji} {opt.text[referenceLang]}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
