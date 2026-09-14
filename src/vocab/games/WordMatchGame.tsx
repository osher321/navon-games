import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import type { VocabGameProps } from './types'
import { shuffle } from '../data/words'
import { useSound } from '../../hooks/useSound'
import Ltr from '../../components/Ltr'
import PronounceButton from '../ui/PronounceButton'

const ROUND_SIZE = 6

/** Tap-to-select matching (not drag-and-drop) so it works identically on mobile and desktop - tap an English word, then its Hebrew match. */
export default function WordMatchGame({ words, onAnswer, onFinish }: VocabGameProps) {
  const { play } = useSound()
  const round = useMemo(() => words.slice(0, Math.min(ROUND_SIZE, words.length)), [words])
  const rightOrder = useMemo(() => shuffle(round), [round])

  const [matched, setMatched] = useState<Set<string>>(new Set())
  const [wrongOnce, setWrongOnce] = useState<Set<string>>(new Set())
  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [selectedRight, setSelectedRight] = useState<string | null>(null)
  const [shake, setShake] = useState<string[]>([])
  const [locked, setLocked] = useState(false)

  const finishIfDone = (nextMatched: Set<string>) => {
    if (nextMatched.size < round.length) return
    const correct = round.filter((w) => !wrongOnce.has(w.id)).length
    onFinish({ correct, total: round.length })
  }

  const tryMatch = (leftId: string | null, rightId: string | null) => {
    if (!leftId || !rightId || locked) return
    setLocked(true)
    if (leftId === rightId) {
      play('correct')
      const word = round.find((w) => w.id === leftId)!
      onAnswer(word, !wrongOnce.has(leftId))
      const next = new Set(matched)
      next.add(leftId)
      setTimeout(() => {
        setMatched(next)
        setSelectedLeft(null)
        setSelectedRight(null)
        setLocked(false)
        finishIfDone(next)
      }, 350)
    } else {
      play('wrong')
      setWrongOnce((prev) => {
        const next = new Set(prev)
        next.add(leftId)
        next.add(rightId)
        return next
      })
      setShake([leftId, rightId])
      setTimeout(() => {
        setShake([])
        setSelectedLeft(null)
        setSelectedRight(null)
        setLocked(false)
      }, 500)
    }
  }

  const pickLeft = (id: string) => {
    if (locked || matched.has(id)) return
    setSelectedLeft(id)
    if (selectedRight) tryMatch(id, selectedRight)
  }
  const pickRight = (id: string) => {
    if (locked || matched.has(id)) return
    setSelectedRight(id)
    if (selectedLeft) tryMatch(selectedLeft, id)
  }

  return (
    <div className="mx-auto max-w-lg">
      <p className="mb-4 text-center text-xs font-bold text-ink/50" aria-live="polite">
        {matched.size} / {round.length} זוגות הותאמו
      </p>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          {round.map((w) => (
            // A <button> can't nest another <button> (the pronounce
            // control), so each row is a flex pair - the pick-target stays
            // a real button, the speaker sits next to it as its own.
            <div key={w.id} className="flex items-center gap-1.5">
              <motion.button
                disabled={matched.has(w.id) || locked}
                onClick={() => pickLeft(w.id)}
                animate={shake.includes(w.id) ? { x: [0, -6, 6, -6, 0] } : {}}
                className={`flex-1 rounded-xl2 px-3 py-3 text-center font-fun text-sm font-extrabold shadow-card card-outline btn-pressable disabled:opacity-40 ${
                  matched.has(w.id) ? 'bg-grass-300 text-white' : selectedLeft === w.id ? 'bg-sky-300 text-white' : 'bg-white text-grape-600'
                }`}
              >
                <Ltr>{w.en}</Ltr>
              </motion.button>
              <PronounceButton text={w.en} size="sm" />
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {rightOrder.map((w) => (
            <motion.button
              key={w.id}
              disabled={matched.has(w.id) || locked}
              onClick={() => pickRight(w.id)}
              animate={shake.includes(w.id) ? { x: [0, 6, -6, 6, 0] } : {}}
              className={`rounded-xl2 px-3 py-3 text-center font-fun text-sm font-extrabold shadow-card card-outline btn-pressable disabled:opacity-40 ${
                matched.has(w.id) ? 'bg-grass-300 text-white' : selectedRight === w.id ? 'bg-sky-300 text-white' : 'bg-white text-ink'
              }`}
            >
              {w.he}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  )
}
