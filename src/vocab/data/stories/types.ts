export type StoryLevel = 'beginner' | 'elementary' | 'intermediate'

export interface StoryLevelDef {
  id: StoryLevel
  icon: string
  labelHe: string
}

export const STORY_LEVELS: StoryLevelDef[] = [
  { id: 'beginner', icon: '🟢', labelHe: 'Beginner' },
  { id: 'elementary', icon: '🔵', labelHe: 'Elementary' },
  { id: 'intermediate', icon: '🟣', labelHe: 'Intermediate' },
]

export function getStoryLevelDef(level: StoryLevel): StoryLevelDef {
  return STORY_LEVELS.find((l) => l.id === level) ?? STORY_LEVELS[0]
}

/** One word's contextual translation - `pronunciationLocale` lets a future word override the default en-US/he-IL pair (e.g. a loanword) without changing the lookup shape. */
export interface StoryVocabWord {
  word: string
  translation: string
  pronunciationLocale?: string
}

/** The language the story itself is written in - not the site's interface language, which stays Hebrew regardless. Adding a new language means one more value here plus one more common-words dictionary; nothing else about the Story shape changes. */
export type StoryLanguage = 'en' | 'es' | 'he'

export interface Story {
  id: string
  title: string
  level: StoryLevel
  language: StoryLanguage
  description: string
  /** Path to this story's unique cover illustration, matching its actual content (scene/characters/setting) rather than a generic placeholder. */
  image: string
  /** Descriptive alt text tying the image back to the story - never a generic "story image" placeholder. */
  imageAlt: string
  lines: string[]
  /** Story-specific words only - common function/frequent words resolve via the shared per-language dictionary (commonWords.ts for English, commonWordsEs.ts for Spanish), so a new story doesn't need to redefine "the"/"el", "was"/"era", "friend"/"amigo", etc. every time. */
  vocabulary: StoryVocabWord[]
}
