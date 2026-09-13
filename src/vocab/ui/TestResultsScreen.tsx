import { motion } from 'framer-motion'
import type { LevelNum } from '../data/types'
import { getLevel } from '../data/levels'
import { TEST_PASS_PCT } from '../data/levels'
import type { VocabTestOutcome } from '../progress/useVocabProgress'
import Ltr from '../../components/Ltr'

interface TestResultsScreenProps {
  level: LevelNum
  outcome: VocabTestOutcome
  onRetry: () => void
  onBackToMenu: () => void
  onGoToNextLevel: () => void
}

export default function TestResultsScreen({ level, outcome, onRetry, onBackToMenu, onGoToNextLevel }: TestResultsScreenProps) {
  const { passed, scorePct, unlockedLevel } = outcome
  const levelDef = getLevel(level)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="mx-auto max-w-sm rounded-blob bg-white p-8 text-center shadow-pop card-outline"
    >
      <div className="text-5xl">{passed ? '🎓' : '❌'}</div>
      <h2 className="mt-2 font-fun text-2xl font-extrabold text-ink">
        {passed ? `עברתם את מבחן ${levelDef.title}!` : 'לא עברתם הפעם'}
      </h2>
      <p className="mt-2 font-fun text-3xl font-extrabold text-grape-600">
        <Ltr>{scorePct}%</Ltr>
      </p>
      <p className="mt-1 text-xs font-bold text-ink/50">
        נדרשים <Ltr>{TEST_PASS_PCT}%</Ltr> כדי לעבור
      </p>

      {passed && unlockedLevel && (
        <div className="mt-4 rounded-xl2 bg-grass-50 p-3">
          <p className="font-fun text-sm font-extrabold text-grass-700">🔓 Level {unlockedLevel} Unlocked</p>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-2">
        {passed ? (
          <>
            {unlockedLevel && (
              <button onClick={onGoToNextLevel} className="rounded-full bg-grass-500 px-6 py-3 font-fun text-lg font-extrabold text-white shadow-card btn-pressable">
                המשיכו ל-Level {unlockedLevel}
              </button>
            )}
            <button onClick={onBackToMenu} className="rounded-full bg-white px-6 py-3 font-fun text-sm font-extrabold text-ink shadow-card card-outline btn-pressable">
              חזרה לתפריט
            </button>
          </>
        ) : (
          <>
            <button onClick={onRetry} className="rounded-full bg-grape-500 px-6 py-3 font-fun text-lg font-extrabold text-white shadow-card btn-pressable">
              🔄 נסו שוב
            </button>
            <button onClick={onBackToMenu} className="rounded-full bg-white px-6 py-3 font-fun text-sm font-extrabold text-ink shadow-card card-outline btn-pressable">
              חזרה לתפריט
            </button>
          </>
        )}
      </div>
    </motion.div>
  )
}
