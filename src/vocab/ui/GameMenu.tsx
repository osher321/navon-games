import { motion } from 'framer-motion'
import type { LevelNum } from '../data/types'
import { getLevel } from '../data/levels'
import { GAME_TYPES, type GameTypeId } from '../games/registry'

interface GameMenuProps {
  level: LevelNum
  testPassed: boolean
  onSelectGame: (gameType: GameTypeId) => void
  onStartTest: () => void
  onBack: () => void
}

export default function GameMenu({ level, testPassed, onSelectGame, onStartTest, onBack }: GameMenuProps) {
  const levelDef = getLevel(level)

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <button onClick={onBack} className="rounded-full bg-white px-4 py-2 font-fun text-sm font-extrabold text-ink shadow-card card-outline btn-pressable">
          ⬅ חזרה
        </button>
        <div className="text-center">
          <p className="font-fun text-sm font-extrabold text-ink">
            {levelDef.icon} Level {level} · {levelDef.title}
          </p>
          <p className="text-xs font-bold text-ink/50">{levelDef.cefr}</p>
        </div>
        <div className="w-16" aria-hidden="true" />
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {GAME_TYPES.map((g) => (
          <motion.button
            key={g.id}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSelectGame(g.id)}
            className="rounded-xl2 bg-white p-4 text-start shadow-card card-outline btn-pressable"
          >
            <span className="text-2xl">{g.icon}</span>
            <p className="mt-1 font-fun text-sm font-extrabold text-ink">{g.title}</p>
            <p className="text-xs text-ink/50">{g.subtitleHe}</p>
          </motion.button>
        ))}
      </div>

      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={onStartTest}
        className="mt-4 w-full rounded-xl2 bg-gradient-to-br from-ink to-grape-700 p-4 text-center font-fun text-base font-extrabold text-white shadow-card card-outline btn-pressable"
      >
        🎯 מבחן רמה {testPassed && <span className="ms-1">✅</span>}
      </motion.button>
    </div>
  )
}
