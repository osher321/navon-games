import { motion } from 'framer-motion'
import { useI18n } from '../i18n/LanguageContext'
import { useProgress } from '../hooks/useProgress'
import { ACHIEVEMENTS } from '../data/achievements'
import Ltr from '../components/Ltr'

export default function Achievements() {
  const { tr } = useI18n()
  const { progress } = useProgress()
  const unlockedSet = new Set(progress.achievements)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-24">
      <h1 className="mb-2 text-center font-fun text-3xl font-extrabold text-grape-600">{tr('achievements_title')}</h1>
      <p className="mb-8 text-center text-ink/50">
        <Ltr>{progress.achievements.length} / {ACHIEVEMENTS.length}</Ltr>
      </p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {ACHIEVEMENTS.map((a) => {
          const unlocked = unlockedSet.has(a.id)
          return (
            <motion.div
              key={a.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`flex flex-col items-center gap-2 rounded-xl2 p-5 text-center shadow-card card-outline ${
                unlocked ? 'bg-gradient-to-br from-sunny-300 to-candy-300 text-white' : 'bg-white/60 text-ink/40'
              }`}
            >
              <span className={`text-4xl ${unlocked ? '' : 'grayscale opacity-50'}`}>{unlocked ? a.icon : '🔒'}</span>
              <span className="font-fun text-sm font-extrabold">{tr(a.nameKey)}</span>
              <span className="text-xs opacity-80">{tr(a.descKey)}</span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
