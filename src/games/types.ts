import type { LangCode, LevelId } from '../types'

export interface GameFinishResult {
  correct: number
  total: number
  missedWordIds?: string[]
  learnedWordIds?: string[]
}

export interface FunGameProps {
  onFinish: (result: GameFinishResult) => void
}

export interface LanguageGameProps {
  lang: LangCode
  level: LevelId
  onFinish: (result: GameFinishResult) => void
}
