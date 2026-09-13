export type CategoryId =
  | 'home'
  | 'work'
  | 'money'
  | 'shopping'
  | 'food'
  | 'travel'
  | 'relationships'
  | 'technology'
  | 'education'
  | 'health'
  | 'environment'
  | 'news'
  | 'business'

export type LevelNum = 1 | 2 | 3 | 4 | 5 | 6

export type Difficulty = 'easy' | 'medium' | 'hard'

/** One vocabulary entry. `pronunciation` is optional free-text (no audio asset) - actual pronunciation is delivered via the Web Speech API, not this field. */
export interface VocabWord {
  id: string
  en: string
  he: string
  example: string
  category: CategoryId
  level: LevelNum
  difficulty: Difficulty
  pronunciation?: string
}
