export type LangCode = 'he' | 'en' | 'ar' | 'es'

export type LevelId = 'beginner' | 'basic' | 'intermediate' | 'advanced'

export interface LevelInfo {
  id: LevelId
  order: number
  xpRequired: number
}

export const LEVELS: LevelInfo[] = [
  { id: 'beginner', order: 1, xpRequired: 0 },
  { id: 'basic', order: 2, xpRequired: 150 },
  { id: 'intermediate', order: 3, xpRequired: 400 },
  { id: 'advanced', order: 4, xpRequired: 800 },
]

export interface VocabItem {
  id: string
  emoji: string
  level: LevelId
  category: string
  text: Record<LangCode, string>
}

export interface SentenceItem {
  id: string
  level: LevelId
  text: Record<LangCode, string[]>
}

export type GameCategory = 'fun' | 'language'

/** Which of the site's two main areas (🎮 בשביל הכיף / 📚 בשביל ללמוד) this game belongs to - the single source of truth the two category pages filter by, instead of hand-maintained duplicate lists. */
export type GameSection = 'fun' | 'learning'

/** For `section: 'learning'` games only - which learning sub-area groups it on the 📚 hub. Language-learning games don't need this: they're already organized by the existing /learn-languages hub, not by this field. */
export type LearningSubcategory = 'math' | 'logic' | 'language'

export interface GameDef {
  id: string
  category: GameCategory
  section: GameSection
  learningSubcategory?: LearningSubcategory
  icon: string
  color: string
  nameKey: string
  descKey: string
  isNew?: boolean
  minLevel?: LevelId
  excludeLangs?: LangCode[]
}

export interface GameResult {
  gameId: string
  lang?: LangCode
  level?: LevelId
  xpEarned: number
  correct: number
  total: number
  perfect: boolean
  playedAt: number
  durationSec: number
  missedWords?: string[]
}

export interface Achievement {
  id: string
  icon: string
  nameKey: string
  descKey: string
  check: (progress: ProgressState) => boolean
}

export interface LanguageProgress {
  xp: number
  unlockedLevels: LevelId[]
  wordsLearned: string[]
  weakWords: Record<string, number>
  gamesPlayed: number
  bestScores: Record<string, number>
}

export interface ChildProfile {
  name: string
  avatar: string
}

export interface ProgressState {
  profile: ChildProfile
  totalXP: number
  stars: number
  trophies: number
  streak: number
  lastPlayedDate: string | null
  gamesPlayedTotal: number
  selectedLanguage: LangCode
  interfaceLanguage: LangCode
  languages: Record<LangCode, LanguageProgress>
  achievements: string[]
  recentGames: GameResult[]
  bestScores: Record<string, number>
  soundOn: boolean
  lastGameId: string | null
  createdAt: number
}
