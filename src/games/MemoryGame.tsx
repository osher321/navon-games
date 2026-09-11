import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { FunGameProps } from './types'
import { useSound } from '../hooks/useSound'
import { useI18n } from '../i18n/LanguageContext'
import Ltr from '../components/Ltr'

const EMOJI_SET = ['🦁', '🐼', '🦊', '🐸', '🦄', '🐨', '🐵', '🐯', '🐙', '🦋', '🐝', '🐢']

interface Card {
  key: string
  emoji: string
  matched: boolean
}

function buildDeck(pairCount: number): Card[] {
  const chosen = [...EMOJI_SET].sort(() => Math.random() - 0.5).slice(0, pairCount)
  const deck = [...chosen, ...chosen].map((emoji, i) => ({ key: `${emoji}-${i}`, emoji, matched: false }))
  return deck.sort(() => Math.random() - 0.5)
}

export default function MemoryGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()
  const pairCount = 8
  const [deck, setDeck] = useState<Card[]>(() => buildDeck(pairCount))
  const [flipped, setFlipped] = useState<number[]>([])
  const [matchedCount, setMatchedCount] = useState(0)
  const [mismatches, setMismatches] = useState(0)
  const [locked, setLocked] = useState(false)
  const finished = matchedCount === pairCount

  useEffect(() => {
    if (finished) {
      onFinish({ correct: matchedCount, total: matchedCount + mismatches })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [finished])

  useEffect(() => {
    if (flipped.length !== 2) return
    setLocked(true)
    const [a, b] = flipped
    const timeout = setTimeout(() => {
      setDeck((prev) => {
        if (prev[a].emoji === prev[b].emoji) {
          play('correct')
          setMatchedCount((c) => c + 1)
          const next = [...prev]
          next[a] = { ...next[a], matched: true }
          next[b] = { ...next[b], matched: true }
          return next
        }
        play('wrong')
        setMismatches((m) => m + 1)
        return prev
      })
      setFlipped([])
      setLocked(false)
    }, 700)
    return () => clearTimeout(timeout)
  }, [flipped, play])

  const handleClick = (idx: number) => {
    if (locked || flipped.includes(idx) || deck[idx].matched || flipped.length === 2) return
    setFlipped((f) => [...f, idx])
  }

  const isVisible = (idx: number) => flipped.includes(idx) || deck[idx].matched

  const gridCols = useMemo(() => 'grid-cols-4', [])

  return (
    <div className="mx-auto max-w-md">
      <p className="mb-3 text-center font-fun font-bold text-ink/60">
        <Ltr>{matchedCount} / {pairCount}</Ltr> 🎴
      </p>
      <div className={`grid ${gridCols} gap-2 sm:gap-3`}>
        {deck.map((card, idx) => (
          <motion.button
            key={card.key}
            onClick={() => handleClick(idx)}
            whileTap={{ scale: 0.92 }}
            className={`aspect-square rounded-2xl text-3xl shadow-card card-outline sm:text-4xl ${
              isVisible(idx) ? 'bg-white' : 'bg-gradient-to-br from-grape-400 to-candy-400'
            } ${card.matched ? 'opacity-60' : ''}`}
          >
            {isVisible(idx) ? card.emoji : '❓'}
          </motion.button>
        ))}
      </div>
      <p className="mt-4 text-center text-sm text-ink/50">
        {tr('score')}: <Ltr>{matchedCount} ✅ / {mismatches} ❌</Ltr>
      </p>
    </div>
  )
}
