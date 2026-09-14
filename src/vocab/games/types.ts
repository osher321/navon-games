import type { VocabWord } from '../data/types'

export interface VocabGameSummary {
  correct: number
  total: number
  /** Only set by Speed Challenge - seconds actually played. */
  elapsedSec?: number
}

/** Every one of the 6 game types implements exactly this - the page orchestrator supplies the session's word pool and a couple of callbacks, and never needs to know which specific game is running. */
export interface VocabGameProps {
  words: VocabWord[]
  /** `mode` defaults to 'normal' XP; Speed Challenge passes 'speed' for its higher per-answer rate. */
  onAnswer: (word: VocabWord, correct: boolean, mode?: 'normal' | 'speed') => void
  onFinish: (summary: VocabGameSummary) => void
  /** `onDone` fires when playback ends (or fails) - drives a 🔊→▶️ button's "now playing" state back to normal. */
  speak: (text: string, onDone?: () => void) => void
  canSpeak: boolean
}
