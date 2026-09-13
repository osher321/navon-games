import { motion } from 'framer-motion'
import Ltr from '../../components/Ltr'

interface ResultsScreenProps {
  correct: number
  total: number
  xpEarned: number
  elapsedSec?: number
  onPlayAgain: () => void
  onBackToMenu: () => void
}

export default function ResultsScreen({ correct, total, xpEarned, elapsedSec, onPlayAgain, onBackToMenu }: ResultsScreenProps) {
  const pct = total > 0 ? Math.round((correct / total) * 100) : 0
  const perfect = total > 0 && correct === total

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-sm rounded-blob bg-white p-8 text-center shadow-pop card-outline"
    >
      <div className="text-5xl">{perfect ? '🌟' : '🎉'}</div>
      <h2 className="mt-2 font-fun text-2xl font-extrabold text-ink">{perfect ? 'סיבוב מושלם!' : 'סיימתם את הסיבוב!'}</h2>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl2 bg-grass-50 p-3">
          <p className="text-xs font-bold text-ink/50">תשובות נכונות</p>
          <p className="font-fun text-xl font-extrabold text-grass-600">
            <Ltr>
              {correct} / {total}
            </Ltr>
          </p>
        </div>
        <div className="rounded-xl2 bg-sky-50 p-3">
          <p className="text-xs font-bold text-ink/50">דיוק</p>
          <p className="font-fun text-xl font-extrabold text-sky-600">
            <Ltr>{pct}%</Ltr>
          </p>
        </div>
        {elapsedSec !== undefined && (
          <div className="rounded-xl2 bg-candy-50 p-3">
            <p className="text-xs font-bold text-ink/50">זמן</p>
            <p className="font-fun text-xl font-extrabold text-candy-600">
              ⏱️ <Ltr>{elapsedSec}</Ltr> שניות
            </p>
          </div>
        )}
        <div className={`rounded-xl2 bg-sunny-50 p-3 ${elapsedSec === undefined ? 'col-span-2' : ''}`}>
          <p className="text-xs font-bold text-ink/50">XP שהרווחתם</p>
          <p className="font-fun text-xl font-extrabold text-sunny-600">
            🔥 +<Ltr>{xpEarned}</Ltr> XP
          </p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-2">
        <button onClick={onPlayAgain} className="rounded-full bg-grape-500 px-6 py-3 font-fun text-lg font-extrabold text-white shadow-card btn-pressable">
          שחקו שוב
        </button>
        <button onClick={onBackToMenu} className="rounded-full bg-white px-6 py-3 font-fun text-sm font-extrabold text-ink shadow-card card-outline btn-pressable">
          תפריט משחקים
        </button>
      </div>
    </motion.div>
  )
}
