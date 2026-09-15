import { motion } from 'framer-motion'
import { useI18n } from '../../i18n/LanguageContext'

interface MainMenuProps {
  onPlay: () => void
  onCharacter: () => void
  onMissions: () => void
  onHowToPlay: () => void
  onSettings: () => void
  onBack: () => void
}

export default function MainMenu({ onPlay, onCharacter, onMissions, onHowToPlay, onSettings, onBack }: MainMenuProps) {
  const { tr } = useI18n()

  return (
    <div className="relative flex min-h-[70vh] flex-col items-center justify-center overflow-hidden rounded-blob bg-gradient-to-br from-ink via-grape-600 to-candy-600 px-6 py-14 text-center text-white shadow-pop sm:min-h-[75vh]">
      <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(2px 2px at 15% 25%, white, transparent), radial-gradient(2px 2px at 75% 15%, white, transparent), radial-gradient(1.5px 1.5px at 45% 70%, white, transparent), radial-gradient(1.5px 1.5px at 85% 60%, white, transparent)' }} />

      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 16 }}>
        <h1 className="font-fun text-5xl font-extrabold tracking-wide sm:text-6xl">GTN</h1>
        <p className="mt-1 font-fun text-lg font-bold text-white/85 sm:text-xl">Grand Theft Neighborhood</p>
        <p className="mt-3 font-fun text-sm font-extrabold uppercase tracking-[0.3em] text-sunny-300">THE CITY IS YOURS</p>
      </motion.div>

      <div className="mt-10 flex w-full max-w-xs flex-col gap-3">
        <button onClick={onPlay} className="rounded-full bg-gradient-to-r from-sunny-400 to-candy-500 px-6 py-4 font-fun text-lg font-extrabold text-ink shadow-pop btn-pressable">
          ▶ PLAY
        </button>
        <button onClick={onCharacter} className="rounded-full bg-white/15 px-6 py-3 font-fun font-extrabold text-white btn-pressable">
          🎮 CHARACTER
        </button>
        <button onClick={onMissions} className="rounded-full bg-white/15 px-6 py-3 font-fun font-extrabold text-white btn-pressable">
          🎯 MISSIONS
        </button>
        <button onClick={onHowToPlay} className="rounded-full bg-white/15 px-6 py-3 font-fun font-extrabold text-white btn-pressable">
          ❓ HOW TO PLAY
        </button>
        <button onClick={onSettings} className="rounded-full bg-white/15 px-6 py-3 font-fun font-extrabold text-white btn-pressable">
          ⚙ SETTINGS
        </button>
        <button onClick={onBack} className="mt-2 rounded-full bg-white px-6 py-3 font-fun font-extrabold text-ink shadow-card btn-pressable">
          ← BACK TO NAVON GAMES
        </button>
      </div>

      <p className="relative mt-8 max-w-sm text-xs text-white/50">{tr('gtn_wip_note')}</p>
    </div>
  )
}
