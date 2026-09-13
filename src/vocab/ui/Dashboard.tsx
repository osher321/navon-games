import type { LevelNum } from '../data/types'
import { LEVELS } from '../data/levels'
import type { VocabProgressState } from '../progress/types'
import { getAccuracyPct, getEnglishLevelLabel, getLevelProgressPct, getWordsLearnedCount, getWordsMasteredCount } from '../progress/stats'
import { VOCAB_ACHIEVEMENTS } from '../progress/achievements'
import LevelCard from './LevelCard'
import Ltr from '../../components/Ltr'

interface DashboardProps {
  progress: VocabProgressState
  hasWeakWords: boolean
  onSelectLevel: (level: LevelNum) => void
  onReviewMistakes: () => void
}

export default function Dashboard({ progress, hasWeakWords, onSelectLevel, onReviewMistakes }: DashboardProps) {
  const wordsLearned = getWordsLearnedCount(progress)
  const wordsMastered = getWordsMasteredCount(progress)
  const accuracy = getAccuracyPct(progress)
  const englishLevel = getEnglishLevelLabel(progress)
  const earnedAchievements = VOCAB_ACHIEVEMENTS.filter((a) => progress.achievements.includes(a.id))

  return (
    <div>
      <div className="mb-6 rounded-blob bg-gradient-to-br from-ink via-grape-700 to-grape-600 p-6 text-white shadow-pop card-outline">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-fun text-xs font-bold uppercase tracking-widest text-white/60">English Level</p>
            <p className="font-fun text-3xl font-extrabold">
              <Ltr>{englishLevel}</Ltr>
            </p>
          </div>
          <div className="text-end">
            <p className="font-fun text-xs font-bold uppercase tracking-widest text-white/60">XP</p>
            <p className="font-fun text-3xl font-extrabold">
              <Ltr>{progress.xp.toLocaleString()}</Ltr>
            </p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatBox label="מילים שנלמדו" value={wordsLearned} />
          <StatBox label="מילים ששולטים" value={wordsMastered} />
          <StatBox label="דיוק" value={`${accuracy}%`} />
          <StatBox label="רצף" value={`🔥 ${progress.streak}`} />
        </div>
      </div>

      {earnedAchievements.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {earnedAchievements.map((a) => (
            <span key={a.id} className="rounded-full bg-white px-3 py-1.5 text-xs font-extrabold text-ink shadow-card card-outline" title={a.description}>
              {a.icon} {a.title}
            </span>
          ))}
        </div>
      )}

      {hasWeakWords && (
        <button
          onClick={onReviewMistakes}
          className="mb-6 w-full rounded-xl2 bg-candy-500 px-5 py-4 text-center font-fun text-base font-extrabold text-white shadow-card card-outline btn-pressable"
        >
          🎯 תרגלו את המילים שבהן טעיתם
        </button>
      )}

      <h2 className="mb-3 font-fun text-lg font-extrabold text-ink">רמות לימוד</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {LEVELS.map((level) => (
          <LevelCard
            key={level.id}
            level={level}
            unlocked={progress.unlockedLevels.includes(level.id)}
            passed={progress.passedTests.includes(level.id)}
            progressPct={getLevelProgressPct(progress, level.id)}
            onSelect={() => onSelectLevel(level.id)}
          />
        ))}
      </div>
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl2 bg-white/10 p-3 text-center">
      <p className="font-fun text-lg font-extrabold">
        <Ltr>{value}</Ltr>
      </p>
      <p className="text-[10px] font-bold text-white/60">{label}</p>
    </div>
  )
}
