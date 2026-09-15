import type { ReactNode } from 'react'
import { useI18n } from '../i18n/LanguageContext'

/** A small pill-shaped HUD readout (score/timer/lives/...) - the same visual language every other game on the site already uses for its in-game stats row. */
export function HudChip({ children, tone = 'sky' }: { children: ReactNode; tone?: 'sky' | 'grass' | 'candy' | 'sunny' | 'grape' }) {
  const toneClass: Record<string, string> = {
    sky: 'bg-sky-100 text-sky-700',
    grass: 'bg-grass-100 text-grass-700',
    candy: 'bg-candy-100 text-candy-700',
    sunny: 'bg-sunny-100 text-sunny-700',
    grape: 'bg-grape-100 text-grape-700',
  }
  return <span className={`rounded-full px-3 py-1 font-fun text-xs font-extrabold shadow-card sm:text-sm ${toneClass[tone]}`}>{children}</span>
}

/** Pause overlay every arcade game shares - Resume/Restart, both wired by the caller. GameScreen's own ResultOverlay already covers the Game Over/Victory screen once a game calls onFinish, so this only needs to handle the mid-game pause case. */
export function PauseOverlay({ onResume, onRestart }: { onResume: () => void; onRestart: () => void }) {
  const { tr } = useI18n()
  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-ink/60 backdrop-blur-sm">
      <div className="w-full max-w-xs rounded-blob bg-white p-6 text-center shadow-pop card-outline">
        <p className="mb-4 font-fun text-2xl font-extrabold text-ink">⏸️ {tr('common_pause')}</p>
        <div className="flex flex-col gap-3">
          <button onClick={onResume} className="rounded-full bg-grass-500 px-5 py-3 font-fun text-base font-extrabold text-white shadow-card btn-pressable">
            ▶ {tr('common_resume')}
          </button>
          <button onClick={onRestart} className="rounded-full bg-grape-500 px-5 py-3 font-fun text-base font-extrabold text-white shadow-card btn-pressable">
            🔁 {tr('common_restart')}
          </button>
        </div>
      </div>
    </div>
  )
}

/** A round on-screen button for touch controls (pause/turbo/attack/jump/...). */
export function TouchButton({
  label,
  onDown,
  onUp,
  className = '',
}: {
  label: string
  onDown: () => void
  onUp?: () => void
  className?: string
}) {
  return (
    <button
      onPointerDown={(e) => {
        e.preventDefault()
        onDown()
      }}
      onPointerUp={onUp}
      onPointerLeave={onUp}
      onContextMenu={(e) => e.preventDefault()}
      aria-label={label}
      className={`grid touch-manipulation select-none place-items-center rounded-full bg-white/90 text-2xl shadow-pop card-outline btn-pressable ${className}`}
    >
      {label}
    </button>
  )
}
