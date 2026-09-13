import { motion } from 'framer-motion'
import type { LevelDef } from '../data/levels'
import ProgressBar from '../../components/ProgressBar'

interface LevelCardProps {
  level: LevelDef
  unlocked: boolean
  passed: boolean
  progressPct: number
  onSelect: () => void
}

export default function LevelCard({ level, unlocked, passed, progressPct, onSelect }: LevelCardProps) {
  if (!unlocked) {
    return (
      <div className="rounded-xl2 bg-white/60 p-5 text-center opacity-70 shadow-card card-outline" aria-disabled="true">
        <div className="text-3xl grayscale">🔒</div>
        <p className="mt-2 font-fun text-sm font-extrabold text-ink/50">Level {level.id}</p>
        <p className="text-xs text-ink/40">השלימו את Level {level.id - 1} כדי לפתוח</p>
      </div>
    )
  }

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onSelect}
      className={`w-full rounded-xl2 bg-gradient-to-br ${level.color} p-5 text-left text-white shadow-card card-outline btn-pressable`}
    >
      <div className="flex items-center justify-between">
        <span className="text-3xl">{level.icon}</span>
        {passed && <span className="rounded-full bg-white/25 px-2 py-0.5 text-[10px] font-extrabold">✅ עבר מבחן</span>}
      </div>
      <p className="mt-2 font-fun text-lg font-extrabold">
        Level {level.id} · {level.title}
      </p>
      <p className="text-[11px] font-bold text-white/70">{level.cefr}</p>
      <p className="mt-1 text-xs text-white/85">{level.subtitleHe}</p>
      <div className="mt-3">
        <ProgressBar value={progressPct} max={100} colorFrom="from-white/80" colorTo="to-white" showLabel />
      </div>
    </motion.button>
  )
}
