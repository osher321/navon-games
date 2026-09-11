import type { LevelId } from '../types'
import { LEVELS } from '../types'
import { useI18n } from '../i18n/LanguageContext'

const LEVEL_DOT: Record<LevelId, string> = {
  beginner: '🟢',
  basic: '🟡',
  intermediate: '🟠',
  advanced: '🔴',
}

const LEVEL_KEY: Record<LevelId, string> = {
  beginner: 'level_beginner',
  basic: 'level_basic',
  intermediate: 'level_intermediate',
  advanced: 'level_advanced',
}

interface LevelSelectorProps {
  value: LevelId
  onChange: (level: LevelId) => void
  unlockedLevels: LevelId[]
}

export default function LevelSelector({ value, onChange, unlockedLevels }: LevelSelectorProps) {
  const { tr } = useI18n()
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {LEVELS.map((lvl) => {
        const isUnlocked = unlockedLevels.includes(lvl.id)
        const active = value === lvl.id
        return (
          <button
            key={lvl.id}
            disabled={!isUnlocked}
            onClick={() => isUnlocked && onChange(lvl.id)}
            className={`flex min-w-[110px] flex-col items-center gap-1 rounded-xl2 px-4 py-3 font-fun font-extrabold shadow-card card-outline btn-pressable transition-all ${
              !isUnlocked
                ? 'cursor-not-allowed bg-ink/10 text-ink/40'
                : active
                ? 'scale-105 bg-sunny-500 text-white'
                : 'bg-white text-ink hover:-translate-y-0.5'
            }`}
          >
            <span className="text-2xl">{isUnlocked ? LEVEL_DOT[lvl.id] : '🔒'}</span>
            <span className="text-sm">{tr(LEVEL_KEY[lvl.id])}</span>
          </button>
        )
      })}
    </div>
  )
}
