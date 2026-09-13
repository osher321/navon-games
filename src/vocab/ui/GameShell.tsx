import type { ReactNode } from 'react'

interface GameShellProps {
  title: string
  subtitle?: string
  onExit: () => void
  children: ReactNode
}

/** Common chrome around every game/test screen - a back button plus a title, so each of the 6 games only has to render its own question UI. */
export default function GameShell({ title, subtitle, onExit, children }: GameShellProps) {
  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-2">
        <button
          onClick={onExit}
          aria-label="חזרה לתפריט המשחקים"
          className="shrink-0 rounded-full bg-white px-4 py-2 font-fun text-sm font-extrabold text-ink shadow-card card-outline btn-pressable"
        >
          ⬅ חזרה
        </button>
        <div className="text-center">
          <p className="font-fun text-sm font-extrabold text-ink">{title}</p>
          {subtitle && <p className="text-xs font-bold text-ink/50">{subtitle}</p>}
        </div>
        <div className="w-16 shrink-0" aria-hidden="true" />
      </div>
      {children}
    </div>
  )
}
