import { useState, type MouseEvent } from 'react'
import { useVocabSpeech } from '../audio'

interface PronounceButtonProps {
  /** The English word or phrase to pronounce. */
  text: string
  size?: 'sm' | 'md'
  /** 'pill' (default) is the small labeled "🔊 האזן" control used next to any displayed word. 'circle' is a large icon-only button for a screen whose whole point IS pressing play (Listening's central replay). Same component, same speak() call, same playing-state feedback either way. */
  variant?: 'pill' | 'circle'
  className?: string
}

/**
 * The one audio/pronunciation control the whole academy uses - every game,
 * the Spelling reveal, and anywhere else an English word is shown reaches
 * for this instead of each rolling its own speak-button markup. Fully
 * self-contained (calls useVocabSpeech() itself), so dropping it next to a
 * word needs zero extra wiring from the caller.
 */
export default function PronounceButton({ text, size = 'md', variant = 'pill', className = '' }: PronounceButtonProps) {
  const { speak, canSpeak } = useVocabSpeech()
  const [playing, setPlaying] = useState(false)

  // No English voice available in this browser - the "appropriate fallback"
  // the spec asks for is simply not showing a control that couldn't do
  // anything, never an error message.
  if (!canSpeak) return null

  const handleClick = (e: MouseEvent) => {
    // Nothing else in this app nests a click handler around where this
    // button lives, but stopping propagation keeps it safe wherever a
    // future layout puts it inside a larger clickable row.
    e.stopPropagation()
    setPlaying(true)
    speak(text, () => setPlaying(false))
  }

  const ariaLabel = playing ? `מקריא את המילה ${text}` : `השמע את המילה ${text} באנגלית`

  if (variant === 'circle') {
    return (
      <button
        type="button"
        onClick={handleClick}
        aria-label={ariaLabel}
        className={`grid h-20 w-20 place-items-center rounded-full text-4xl text-white shadow-card btn-pressable transition-colors ${
          playing ? 'bg-grape-700' : 'bg-grape-500'
        } ${className}`}
      >
        {playing ? '▶️' : '🔊'}
      </button>
    )
  }

  const sizeClasses = size === 'sm' ? 'min-h-[36px] px-3 py-1.5 text-xs' : 'min-h-[44px] px-4 py-2.5 text-sm'
  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={ariaLabel}
      className={`inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full font-fun font-extrabold shadow-card card-outline btn-pressable transition-colors ${sizeClasses} ${
        playing ? 'bg-grape-500 text-white' : 'bg-sky-100 text-sky-700'
      } ${className}`}
    >
      <span aria-hidden="true">{playing ? '▶️' : '🔊'}</span> האזן
    </button>
  )
}
