import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { LanguageGameProps } from './types'
import { vocabByLevelAndLang, vocabById, shuffle } from '../data/vocabulary'
import { useProgress } from '../hooks/useProgress'
import { useSound } from '../hooks/useSound'
import { useI18n } from '../i18n/LanguageContext'
import Ltr from '../components/Ltr'

interface Card {
  uid: string
  wordId: string
  label: string
  matched: boolean
}

const PAIR_COUNT = 6

export default function WordMemoryGame({ lang, level, onFinish }: LanguageGameProps) {
  const { tr } = useI18n()
  const { getAdaptiveWords } = useProgress()
  const { play } = useSound()
  const referenceLang = lang === 'he' ? 'en' : 'he'

  const pool = useMemo(() => vocabByLevelAndLang(level), [level])
  const wordIds = useMemo(() => {
    const ids = getAdaptiveWords(lang, level, pool.map((v) => v.id), Math.min(PAIR_COUNT, pool.length))
    return ids.length ? ids : pool.slice(0, PAIR_COUNT).map((v) => v.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, pool])

  const [deck, setDeck] = useState<Card[]>(() => []);
  useEffect(() => {
    const cards: Card[] = []
    wordIds.forEach((id) => {
      const item = vocabById(id)
      if (!item) return
      cards.push({ uid: `${id}-w`, wordId: id, label: item.text[lang], matched: false })
      cards.push({ uid: `${id}-t`, wordId: id, label: item.text[referenceLang], matched: false })
    })
    setDeck(shuffle(cards))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wordIds.join(',')])

  const [flipped, setFlipped] = useState<number[]>([])
  const [matchedCount, setMatchedCount] = useState(0)
  const [mismatches, setMismatches] = useState(0)
  const [missed, setMissed] = useState<string[]>([])
  const [locked, setLocked] = useState(false)
  const finished = wordIds.length > 0 && matchedCount === wordIds.length

  useEffect(() => {
    if (finished) {
      onFinish({ correct: matchedCount, total: matchedCount + mismatches, missedWordIds: missed, learnedWordIds: wordIds })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished])

  useEffect(() => {
    if (flipped.length !== 2) return
    setLocked(true)
    const [a, b] = flipped
    const timeout = setTimeout(() => {
      setDeck((prev) => {
        if (prev[a].wordId === prev[b].wordId) {
          play('correct')
          setMatchedCount((c) => c + 1)
          const next = [...prev]
          next[a] = { ...next[a], matched: true }
          next[b] = { ...next[b], matched: true }
          return next
        }
        play('wrong')
        setMismatches((m) => m + 1)
        setMissed((ms) => [...ms, prev[a].wordId, prev[b].wordId])
        return prev
      })
      setFlipped([])
      setLocked(false)
    }, 800)
    return () => clearTimeout(timeout)
  }, [flipped, play])

  if (deck.length === 0) return null

  const handleClick = (idx: number) => {
    if (locked || flipped.includes(idx) || deck[idx].matched || flipped.length === 2) return
    setFlipped((f) => [...f, idx])
  }

  const isVisible = (idx: number) => flipped.includes(idx) || deck[idx].matched

  return (
    <div className="mx-auto max-w-lg">
      <p className="mb-3 text-center font-fun font-bold text-ink/60">
        <Ltr>{matchedCount} / {wordIds.length}</Ltr> 🎴 · {tr('game_word_memory_desc')}
      </p>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
        {deck.map((card, idx) => (
          <motion.button
            key={card.uid}
            onClick={() => handleClick(idx)}
            whileTap={{ scale: 0.92 }}
            className={`flex aspect-[4/3] items-center justify-center rounded-2xl px-1 text-center font-fun text-sm font-extrabold shadow-card card-outline sm:text-base ${
              isVisible(idx) ? 'bg-white text-grape-600' : 'bg-gradient-to-br from-sunny-400 to-candy-400 text-white'
            } ${card.matched ? 'opacity-50' : ''}`}
          >
            {isVisible(idx) ? card.label : '❓'}
          </motion.button>
        ))}
      </div>
    </div>
  )
}
