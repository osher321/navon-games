import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { FunGameProps } from './types'
import { useSound } from '../hooks/useSound'
import { useI18n } from '../i18n/LanguageContext'

const ROUND_SECONDS = 25
const SPAWN_MS = 850
const LIFESPAN_MS = 1250

interface StarObj {
  id: number
  top: number
  left: number
}

export default function CatchStarsGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()
  const [stars, setStars] = useState<StarObj[]>([])
  const [caught, setCaught] = useState(0)
  const [missed, setMissed] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const idRef = useRef(0)
  const finishedRef = useRef(false)
  const caughtRef = useRef(0)
  const missedRef = useRef(0)

  useEffect(() => {
    const spawnTimer = setInterval(() => {
      const id = idRef.current++
      const star: StarObj = { id, top: 10 + Math.random() * 65, left: 8 + Math.random() * 80 }
      setStars((s) => [...s, star])
      setTimeout(() => {
        setStars((s) => {
          if (s.some((st) => st.id === id)) {
            missedRef.current += 1
            setMissed((m) => m + 1)
          }
          return s.filter((st) => st.id !== id)
        })
      }, LIFESPAN_MS)
    }, SPAWN_MS)

    const countdown = setInterval(() => {
      setTimeLeft((t) => t - 1)
    }, 1000)

    return () => {
      clearInterval(spawnTimer)
      clearInterval(countdown)
    }
  }, [])

  useEffect(() => {
    if (timeLeft <= 0 && !finishedRef.current) {
      finishedRef.current = true
      onFinish({ correct: caughtRef.current, total: caughtRef.current + missedRef.current || 1 })
    }
  }, [timeLeft, onFinish])

  const catchStar = (id: number) => {
    setStars((s) => s.filter((st) => st.id !== id))
    caughtRef.current += 1
    setCaught((c) => c + 1)
    play('correct')
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between px-2 font-fun font-extrabold">
        <span className="rounded-full bg-grass-100 px-3 py-1 text-grass-600">⭐ {caught}</span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-600">⏱️ {Math.max(0, timeLeft)}s</span>
        <span className="rounded-full bg-candy-100 px-3 py-1 text-candy-600">❌ {missed}</span>
      </div>
      <div className="relative h-[420px] w-full overflow-hidden rounded-blob bg-gradient-to-b from-grape-700 via-grape-600 to-ink shadow-pop">
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: 'radial-gradient(2px 2px at 20% 30%, white, transparent), radial-gradient(2px 2px at 70% 60%, white, transparent), radial-gradient(1.5px 1.5px at 40% 80%, white, transparent), radial-gradient(1.5px 1.5px at 85% 20%, white, transparent)' }} />
        <AnimatePresence>
          {stars.map((star) => (
            <motion.button
              key={star.id}
              onClick={() => catchStar(star.id)}
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15 }}
              style={{ top: `${star.top}%`, left: `${star.left}%` }}
              className="absolute text-4xl drop-shadow-[0_0_10px_rgba(255,196,0,0.8)] active:scale-90 sm:text-5xl"
            >
              ⭐
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
      <p className="mt-3 text-center text-sm text-ink/50">{tr('game_catch_stars_desc')}</p>
    </div>
  )
}
