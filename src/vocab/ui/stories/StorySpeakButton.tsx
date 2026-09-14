import { useState } from 'react'
import { useSpeech } from '../../../hooks/useSpeech'
import type { LangCode } from '../../../types'

interface StorySpeakButtonProps {
  text: string
  lang: LangCode
  /** Always used for aria-label (e.g. "השמע את המשפט באנגלית"); also shown as visible text unless `iconOnly` is set. */
  label: string
  size?: 'sm' | 'md'
  /** Compact per-line "listen to sentence" buttons show only the icon - the visible label text is skipped, but `label` still drives the aria-label. */
  iconOnly?: boolean
  className?: string
}

/**
 * The stories feature needs BOTH English and Hebrew pronunciation (the
 * word-info card speaks the English word and its Hebrew translation), so
 * this uses the site's shared `useSpeech()` hook directly with an explicit
 * `lang`, rather than the games' `PronounceButton` (which is deliberately
 * English-only and left untouched). Same play/pause visual pattern either way.
 */
export default function StorySpeakButton({ text, lang, label, size = 'md', iconOnly = false, className = '' }: StorySpeakButtonProps) {
  const { speak, supported, canSpeak } = useSpeech()
  const [playing, setPlaying] = useState(false)

  if (!supported || !canSpeak(lang)) return null

  const sizeClasses = size === 'sm' ? 'min-h-[36px] min-w-[36px] px-3 py-1.5 text-xs' : 'min-h-[44px] px-4 py-2.5 text-sm'

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        setPlaying(true)
        speak(text, lang, () => setPlaying(false))
      }}
      aria-label={playing ? `מקריא: ${label}` : label}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-fun font-extrabold shadow-card card-outline btn-pressable transition-colors ${sizeClasses} ${
        playing ? 'bg-grape-500 text-white' : 'bg-sky-100 text-sky-700'
      } ${className}`}
    >
      <span aria-hidden="true">{playing ? '▶️' : '🔊'}</span>
      {!iconOnly && ` ${label}`}
    </button>
  )
}
