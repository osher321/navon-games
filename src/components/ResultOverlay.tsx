import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useI18n } from '../i18n/LanguageContext'
import { ACHIEVEMENTS } from '../data/achievements'
import { fireBigConfetti } from './confetti'
import { useSound } from '../hooks/useSound'
import Ltr from './Ltr'

interface ResultOverlayProps {
  correct: number
  total: number
  xpEarned: number
  perfect: boolean
  newAchievements: string[]
  leveledUp: boolean
  onPlayAgain: () => void
  onBack: () => void
}

export default function ResultOverlay({ correct, total, xpEarned, perfect, newAchievements, leveledUp, onPlayAgain, onBack }: ResultOverlayProps) {
  const { tr } = useI18n()
  const { play } = useSound()

  useEffect(() => {
    fireBigConfetti()
    play(perfect ? 'levelup' : 'success')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const pct = total > 0 ? Math.round((correct / total) * 100) : 0

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/50 p-4 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        className="w-full max-w-sm rounded-blob bg-white p-6 text-center shadow-pop card-outline"
      >
        <div className="text-6xl">{perfect ? '🏆' : pct >= 60 ? '🎉' : '💪'}</div>
        <h2 className="mt-2 font-fun text-2xl font-extrabold text-grape-600">{tr('game_over')}</h2>

        {perfect && <p className="mt-1 font-fun font-bold text-candy-500">{tr('perfect_score')}</p>}
        {leveledUp && <p className="mt-1 font-fun font-bold text-sunny-600">{tr('level_up')} 🎚️</p>}

        <div className="mx-auto mt-4 flex max-w-[220px] items-center justify-between rounded-xl2 bg-grass-50 px-4 py-3 font-fun font-extrabold text-grass-600 shadow-card">
          <span>{tr('score')}</span>
          <Ltr>
            {correct} / {total}
          </Ltr>
        </div>

        <div className="mx-auto mt-2 flex max-w-[220px] items-center justify-between rounded-xl2 bg-sunny-50 px-4 py-3 font-fun font-extrabold text-sunny-600 shadow-card">
          <span>{tr('xp')}</span>
          <span>+{xpEarned}</span>
        </div>

        {newAchievements.length > 0 && (
          <div className="mt-4 space-y-2">
            {newAchievements.map((id) => {
              const a = ACHIEVEMENTS.find((x) => x.id === id)
              if (!a) return null
              return (
                <div key={id} className="flex items-center gap-2 rounded-xl2 bg-candy-50 px-3 py-2 text-start font-fun text-sm font-bold text-candy-600 shadow-card">
                  <span className="text-2xl">{a.icon}</span>
                  <span>{tr(a.nameKey)}</span>
                </div>
              )
            })}
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          <button
            onClick={onPlayAgain}
            className="rounded-full bg-gradient-to-r from-candy-500 to-grape-500 px-6 py-3 font-fun font-extrabold text-white shadow-pop btn-pressable"
          >
            {tr('play_again')} 🔁
          </button>
          <button onClick={onBack} className="rounded-full bg-ink/5 px-6 py-3 font-fun font-extrabold text-ink btn-pressable">
            {tr('choose_another_game')}
          </button>
        </div>
      </motion.div>
    </div>
  )
}
