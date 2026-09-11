import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { FunGameProps } from './types'
import { useSound } from '../hooks/useSound'
import { useI18n } from '../i18n/LanguageContext'

const ROUND_SECONDS = 28
const SPAWN_MS = 950

const COLORS = ['from-candy-400 to-candy-500', 'from-sky-400 to-sky-500', 'from-grass-400 to-grass-500', 'from-sunny-400 to-sunny-500', 'from-grape-400 to-grape-500']

interface Balloon {
  id: number
  left: number
  isBomb: boolean
  duration: number
  color: string
}

export default function BalloonPopGame({ onFinish }: FunGameProps) {
  const { tr } = useI18n()
  const { play } = useSound()
  const [balloons, setBalloons] = useState<Balloon[]>([])
  const [popped, setPopped] = useState(0)
  const [mistakes, setMistakes] = useState(0)
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS)
  const idRef = useRef(0)
  const poppedRef = useRef(0)
  const mistakesRef = useRef(0)
  const finishedRef = useRef(false)
  const [running, setRunning] = useState(true)

  useEffect(() => {
    if (!running) return
    const spawnTimer = setInterval(() => {
      const id = idRef.current++
      const balloon: Balloon = {
        id,
        left: 6 + Math.random() * 84,
        isBomb: Math.random() < 0.22,
        duration: 3.4 + Math.random() * 1.4,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }
      setBalloons((b) => [...b, balloon])
    }, SPAWN_MS)

    const countdown = setInterval(() => setTimeLeft((t) => t - 1), 1000)

    return () => {
      clearInterval(spawnTimer)
      clearInterval(countdown)
    }
  }, [running])

  useEffect(() => {
    if (timeLeft <= 0 && !finishedRef.current) {
      finishedRef.current = true
      setRunning(false)
      onFinish({ correct: poppedRef.current, total: poppedRef.current + mistakesRef.current || 1 })
    }
  }, [timeLeft, onFinish])

  const pop = (balloon: Balloon) => {
    setBalloons((b) => b.filter((x) => x.id !== balloon.id))
    if (balloon.isBomb) {
      mistakesRef.current += 1
      setMistakes((m) => m + 1)
      play('wrong')
    } else {
      poppedRef.current += 1
      setPopped((p) => p + 1)
      play('correct')
    }
  }

  const escaped = (balloon: Balloon) => {
    setBalloons((b) => {
      const stillThere = b.some((x) => x.id === balloon.id)
      if (stillThere && !balloon.isBomb) {
        mistakesRef.current += 1
        setMistakes((m) => m + 1)
      }
      return b.filter((x) => x.id !== balloon.id)
    })
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-3 flex items-center justify-between px-2 font-fun font-extrabold">
        <span className="rounded-full bg-grass-100 px-3 py-1 text-grass-600">🎈 {popped}</span>
        <span className="rounded-full bg-sky-100 px-3 py-1 text-sky-600">⏱️ {Math.max(0, timeLeft)}s</span>
        <span className="rounded-full bg-candy-100 px-3 py-1 text-candy-600">💥 {mistakes}</span>
      </div>
      <div className="relative h-[440px] w-full overflow-hidden rounded-blob bg-gradient-to-b from-sky-200 via-sky-100 to-white shadow-pop">
        <AnimatePresence>
          {balloons.map((balloon) => (
            <motion.button
              key={balloon.id}
              onClick={() => pop(balloon)}
              initial={{ top: '105%' }}
              animate={{ top: '-15%' }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ duration: balloon.duration, ease: 'linear' }}
              onAnimationComplete={() => escaped(balloon)}
              style={{ left: `${balloon.left}%` }}
              className="absolute -translate-x-1/2 text-5xl active:scale-90"
            >
              {balloon.isBomb ? (
                <span className="drop-shadow-lg">💣</span>
              ) : (
                <span className={`inline-block rounded-full bg-gradient-to-b ${balloon.color} px-1 drop-shadow-lg`}>🎈</span>
              )}
            </motion.button>
          ))}
        </AnimatePresence>
      </div>
      <p className="mt-3 text-center text-sm text-ink/50">{tr('game_balloon_pop_desc')} · 💣 = {tr('wrong_answer')}</p>
    </div>
  )
}
