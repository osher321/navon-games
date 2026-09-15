export type StoryLevel = 'beginner' | 'elementary' | 'intermediate' | 'upper_intermediate' | 'advanced'

export interface StoryLevelDef {
  id: StoryLevel
  icon: string
  labelHe: string
}

export const STORY_LEVELS: StoryLevelDef[] = [
  { id: 'beginner', icon: '🟢', labelHe: 'Beginner' },
  { id: 'elementary', icon: '🔵', labelHe: 'Elementary' },
  { id: 'intermediate', icon: '🟡', labelHe: 'Intermediate' },
  { id: 'upper_intermediate', icon: '🟠', labelHe: 'Upper Intermediate' },
  { id: 'advanced', icon: '🔴', labelHe: 'Advanced' },
]

export function getStoryLevelDef(level: StoryLevel): StoryLevelDef {
  return STORY_LEVELS.find((l) => l.id === level) ?? STORY_LEVELS[0]
}

/** Target-audience age bands - a story can belong to more than one (kept as
    an array always, even for a single band, so filtering code never has to
    branch on "is this a string or an array"). */
export type AgeRange = '6-8' | '9-12' | '13-15' | '16-18' | '18+'

export interface AgeRangeDef {
  id: AgeRange
  icon: string
}

export const AGE_RANGES: AgeRangeDef[] = [
  { id: '6-8', icon: '👧' },
  { id: '9-12', icon: '🧒' },
  { id: '13-15', icon: '👦' },
  { id: '16-18', icon: '🧑' },
  { id: '18+', icon: '👨' },
]

/** A story can carry more than one genre (e.g. adventure + comedy). */
export type StoryGenre = 'adventure' | 'mystery' | 'suspense' | 'action' | 'romance' | 'scifi' | 'fantasy' | 'comedy' | 'survival' | 'detective'

export interface StoryGenreDef {
  id: StoryGenre
  icon: string
  labelHe: string
}

export const STORY_GENRES: StoryGenreDef[] = [
  { id: 'adventure', icon: '🌟', labelHe: 'הרפתקה' },
  { id: 'mystery', icon: '🔍', labelHe: 'מסתורין' },
  { id: 'suspense', icon: '😱', labelHe: 'מתח' },
  { id: 'action', icon: '⚡', labelHe: 'אקשן' },
  { id: 'romance', icon: '❤️', labelHe: 'רומנטיקה' },
  { id: 'scifi', icon: '🚀', labelHe: 'מדע בדיוני' },
  { id: 'fantasy', icon: '🧙', labelHe: 'פנטזיה' },
  { id: 'comedy', icon: '😂', labelHe: 'קומדיה' },
  { id: 'survival', icon: '🏝️', labelHe: 'הישרדות' },
  { id: 'detective', icon: '🕵️', labelHe: 'תעלומה' },
]

export function getGenreDef(genre: StoryGenre): StoryGenreDef {
  return STORY_GENRES.find((g) => g.id === genre) ?? STORY_GENRES[0]
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
  /** Target-audience age band(s) - always an array, even for a single value. */
  ageRange: AgeRange[]
  /** One or more genres - real variety across the library, not every story tagged the same way. */
  genres: StoryGenre[]
  description: string
  /** Path to this story's unique cover illustration, matching its actual content (scene/characters/setting) rather than a generic placeholder. */
  image: string
  /** Descriptive alt text tying the image back to the story - never a generic "story image" placeholder. */
  imageAlt: string
  lines: string[]
  /** Story-specific words only - common function/frequent words resolve via the shared per-language dictionary (commonWords.ts for English, commonWordsEs.ts for Spanish), so a new story doesn't need to redefine "the"/"el", "was"/"era", "friend"/"amigo", etc. every time. */
  vocabulary: StoryVocabWord[]
}
