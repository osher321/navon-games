import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { FunGameProps } from './types'
import { useSound } from '../hooks/useSound'
import { useProgress } from '../hooks/useProgress'
import { useI18n } from '../i18n/LanguageContext'
import Ltr from '../components/Ltr'

const LETTER_NAMES: Record<string, string> = {
  א: 'אלף',
  ב: 'בית',
  ג: 'גימל',
  ד: 'דלת',
  ה: 'הא',
  ו: 'וו',
  ז: 'זין',
  ח: 'חית',
  ט: 'טית',
  י: 'יוד',
  כ: 'כף',
  ל: 'למד',
  מ: 'מם',
  נ: 'נון',
  ס: 'סמך',
  ע: 'עין',
  פ: 'פא',
  צ: 'צדי',
  ק: 'קוף',
  ר: 'ריש',
  ש: 'שין',
  ת: 'תיו',
}
const ALPHABET = Object.keys(LETTER_NAMES)

type Difficulty = 'easy' | 'medium' | 'hard'
const DIFFICULTY_PAIRS: Record<Difficulty, number> = { easy: 6, medium: 11, hard: 22 }
const DIFFICULTY_COLS: Record<Difficulty, number> = { easy: 4, medium: 5, hard: 6 }
const DIFFICULTY_DOT: Record<Difficulty, string> = { easy: '🟢', medium: '🟡', hard: '🔴' }
const DIFFICULTY_KEY: Record<Difficulty, string> = { easy: 'difficulty_easy', medium: 'difficulty_medium', hard: 'difficulty_hard' }

interface Card {
  key: string
  letter: string
  matched: boolean
}

function buildDeck(pairCount: number): Card[] {
  const chosen = [...ALPHABET].sort(() => Math.random() - 0.5).slice(0, pairCount)
  const deck = [...chosen, ...chosen].map((letter, i) => ({ key: `${letter}-${i}`, letter, matched: false }))
  return deck.sort(() => Math.random() - 0.5)
}

function speakLetter(letter: string) {
  try {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    const utterance = new SpeechSynthesisUtterance(LETTER_NAMES[letter] ?? letter)
    utterance.lang = 'he-IL'
    utterance.rate = 0.9
    window.speechSynthesis.cancel()
    window.speechSynthesis.speak(utterance)
  } catch {
    // speech synthesis unavailable in this browser - fail silently
  }
}

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60)
  const s = totalSeconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function HebrewLettersMemoryGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()
  const { progress } = useProgress()

  const [phase, setPhase] = useState<'select' | 'playing'>('select')
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [deck, setDeck] = useState<Card[]>([])
  const [flipped, setFlipped] = useState<number[]>([])
  const [matchedCount, setMatchedCount] = useState(0)
  const [moves, setMoves] = useState(0)
  const [mismatches, setMismatches] = useState(0)
  const [locked, setLocked] = useState(false)
  const [seconds, setSeconds] = useState(0)
  const [winBanner, setWinBanner] = useState(false)

  const pairCount = DIFFICULTY_PAIRS[difficulty]
  const finishedRef = useRef(false)

  const startGame = (diff: Difficulty) => {
    setDifficulty(diff)
    setDeck(buildDeck(DIFFICULTY_PAIRS[diff]))
    setFlipped([])
    setMatchedCount(0)
    setMoves(0)
    setMismatches(0)
    setLocked(false)
    setSeconds(0)
    setWinBanner(false)
    finishedRef.current = false
    setPhase('playing')
  }

  useEffect(() => {
    if (phase !== 'playing' || winBanner) return
    const timer = window.setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => window.clearInterval(timer)
  }, [phase, winBanner])

  useEffect(() => {
    if (phase === 'playing' && pairCount > 0 && matchedCount === pairCount && !finishedRef.current) {
      finishedRef.current = true
      play('levelup')
      setWinBanner(true)
      const timeout = window.setTimeout(() => {
        onFinish({ correct: matchedCount, total: matchedCount + mismatches || 1 })
      }, 1600)
      return () => window.clearTimeout(timeout)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matchedCount, phase])

  useEffect(() => {
    if (flipped.length !== 2) return
    setLocked(true)
    setMoves((m) => m + 1)
    const [a, b] = flipped
    const timeout = window.setTimeout(() => {
      setDeck((prev) => {
        if (prev[a].letter === prev[b].letter) {
          play('correct')
          if (progress.soundOn) speakLetter(prev[a].letter)
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
    return () => window.clearTimeout(timeout)
  }, [flipped, play, progress.soundOn])

  const handleClick = (idx: number) => {
    if (locked || flipped.includes(idx) || deck[idx].matched || flipped.length === 2) return
    setFlipped((f) => [...f, idx])
  }

  const isVisible = (idx: number) => flipped.includes(idx) || deck[idx].matched

  if (phase === 'select') {
    return (
      <div className="mx-auto max-w-lg text-center">
        <h2 className="mb-1 font-fun text-xl font-extrabold text-grape-600">{tr('game_hebrew_memory_name')}</h2>
        <p className="mb-5 text-ink/50">{tr('choose_level')}</p>
        <div className="flex flex-wrap justify-center gap-3">
          {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
            <button
              key={diff}
              onClick={() => startGame(diff)}
              className="flex min-w-[120px] flex-col items-center gap-1 rounded-xl2 bg-white px-4 py-3 font-fun font-extrabold text-ink shadow-card card-outline btn-pressable transition-all hover:-translate-y-0.5"
            >
              <span className="text-2xl">{DIFFICULTY_DOT[diff]}</span>
              <span className="text-sm">{tr(DIFFICULTY_KEY[diff])}</span>
              <span className="text-xs text-ink/40">
                <Ltr>{DIFFICULTY_PAIRS[diff]}</Ltr> {tr('pairs_label')}
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex flex-wrap items-center justify-center gap-2 px-2 font-fun font-extrabold">
        <span className="rounded-full bg-grape-100 px-3 py-1 text-grape-600">
          {DIFFICULTY_DOT[difficulty]} {tr(DIFFICULTY_KEY[difficulty])}
        </span>
        <span className="rounded-full bg-grass-100 px-3 py-1 text-grass-600">
          🎴 <Ltr>{matchedCount}/{pairCount}</Ltr>
        </span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-600">
          🕹️ {tr('moves')}: <Ltr>{moves}</Ltr>
        </span>
        <span className="rounded-full bg-sunny-100 px-3 py-1 text-sunny-600">
          ⏱️ <Ltr>{formatTime(seconds)}</Ltr>
        </span>
        <button
          onClick={() => startGame(difficulty)}
          className="rounded-full bg-candy-100 px-3 py-1 text-candy-600 btn-pressable"
        >
          🔄 {tr('new_game')}
        </button>
      </div>

      <div className="relative">
        <div
          className="mx-auto grid max-w-xl gap-2 sm:gap-3"
          style={{ gridTemplateColumns: `repeat(${DIFFICULTY_COLS[difficulty]}, minmax(0, 1fr))` }}
        >
          {deck.map((card, idx) => (
            <button
              key={card.key}
              onClick={() => handleClick(idx)}
              disabled={locked || card.matched}
              aria-label={card.matched ? card.letter : undefined}
              className="aspect-square touch-manipulation"
              style={{ perspective: 800 }}
            >
              <motion.div
                className="relative h-full w-full [transform-style:preserve-3d]"
                animate={{ rotateY: isVisible(idx) ? 180 : 0 }}
                whileTap={{ scale: locked || card.matched ? 1 : 0.94 }}
                transition={{ duration: 0.45, ease: 'easeOut' }}
              >
                <div className="absolute inset-0 grid place-items-center rounded-2xl bg-gradient-to-br from-grape-400 to-candy-400 text-2xl shadow-card card-outline [backface-visibility:hidden] sm:text-3xl">
                  ❓
                </div>
                <div
                  className={`absolute inset-0 grid place-items-center rounded-2xl text-3xl font-fun font-extrabold shadow-card card-outline [backface-visibility:hidden] sm:text-4xl ${
                    card.matched ? 'animate-pulseGlow bg-grass-100 text-grass-600' : 'bg-white text-grape-600'
                  }`}
                  style={{ transform: 'rotateY(180deg)' }}
                >
                  {card.letter}
                </div>
              </motion.div>
            </button>
          ))}
        </div>

        {winBanner && (
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="absolute inset-0 grid place-items-center rounded-blob bg-ink/50 backdrop-blur-sm"
          >
            <div className="rounded-xl2 bg-white px-8 py-6 text-center shadow-pop">
              <div className="text-4xl">🏆</div>
              <p className="mt-2 font-fun text-lg font-extrabold text-grape-600">{tr('game_over')}</p>
              <p className="mt-2 text-sm text-ink/60">
                {tr('moves')}: <Ltr>{moves}</Ltr> · ⏱️ <Ltr>{formatTime(seconds)}</Ltr>
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-ink/50">{tr('game_hebrew_memory_desc')}</p>
    </div>
  )
}
