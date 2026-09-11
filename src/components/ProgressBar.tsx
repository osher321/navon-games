interface ProgressBarProps {
  value: number
  max: number
  colorFrom?: string
  colorTo?: string
  height?: number
  showLabel?: boolean
}

export default function ProgressBar({ value, max, colorFrom = 'from-grass-400', colorTo = 'to-sky-400', height = 14, showLabel = false }: ProgressBarProps) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0
  return (
    <div className="w-full">
      <div
        className="w-full rounded-full bg-white/70 card-outline overflow-hidden"
        style={{ height }}
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={`h-full rounded-full bg-gradient-to-r ${colorFrom} ${colorTo} bg-shimmer animate-shimmer transition-all duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && <div className="mt-1 text-xs font-bold text-ink/60">{pct}%</div>}
    </div>
  )
}
