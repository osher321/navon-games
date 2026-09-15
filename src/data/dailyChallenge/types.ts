import type { LangCode } from '../../types'

/** A local 5-tier scale for the Daily Challenge specifically. Deliberately
    NOT merged into the site-wide `LevelId` (4 tiers, used to gate every
    language game's unlockedLevels/xpRequired) - adding a 5th tier there
    would touch every language game's level-gating logic. 'expert' reuses
    the site's 'advanced'-tagged content pool (see mapToSiteLevel below)
    with a harder question-type mix instead of needing its own content. */
export type ChallengeLevel = 'beginner' | 'basic' | 'intermediate' | 'advanced' | 'expert'

export interface ChallengeLevelDef {
  id: ChallengeLevel
  icon: string
  labelHe: string
}

export const CHALLENGE_LEVELS: ChallengeLevelDef[] = [
  { id: 'beginner', icon: '🟢', labelHe: 'מתחילים' },
  { id: 'basic', icon: '🔵', labelHe: 'בסיסי' },
  { id: 'intermediate', icon: '🟠', labelHe: 'בינוני' },
  { id: 'advanced', icon: '🔴', labelHe: 'מתקדם' },
  { id: 'expert', icon: '🟣', labelHe: 'מומחה' },
]

export function getChallengeLevelDef(level: ChallengeLevel): ChallengeLevelDef {
  return CHALLENGE_LEVELS.find((l) => l.id === level) ?? CHALLENGE_LEVELS[0]
}

/** Maps the challenge's 5-tier scale onto the site's existing 4-tier
    LevelId, which is what VOCABULARY/SENTENCES are actually tagged with -
    'expert' pulls from the same 'advanced' pool (the hardest content that
    exists), differentiated instead by a harder question-type mix. */
export function mapToSiteLevel(level: ChallengeLevel): 'beginner' | 'basic' | 'intermediate' | 'advanced' {
  return level === 'expert' ? 'advanced' : level
}

export const QUESTION_KIND_ORDER = ['vocabulary', 'listening', 'fill_blank', 'translation', 'spelling', 'scramble', 'multiple_choice', 'story'] as const
export type QuestionKind = (typeof QUESTION_KIND_ORDER)[number]

// labelKey points at a translation key (see i18n/translations.ts) rather
// than a hardcoded Hebrew string, so this small meta label follows the
// site's interface language like every other piece of UI chrome.
export const QUESTION_KIND_META: Record<QuestionKind, { icon: string; labelKey: string }> = {
  vocabulary: { icon: '🧠', labelKey: 'qkind_vocabulary' },
  listening: { icon: '🔊', labelKey: 'qkind_listening' },
  fill_blank: { icon: '✍️', labelKey: 'qkind_fill_blank' },
  translation: { icon: '🔄', labelKey: 'qkind_translation' },
  spelling: { icon: '🔤', labelKey: 'qkind_spelling' },
  scramble: { icon: '🧩', labelKey: 'qkind_scramble' },
  multiple_choice: { icon: '🎯', labelKey: 'qkind_multiple_choice' },
  story: { icon: '📖', labelKey: 'qkind_story' },
}

interface BaseQuestion {
  id: string
  kind: QuestionKind
  /** The language being practiced - always set (regardless of whether this
      particular question also has a speakable prompt) so the UI can pick
      the right RTL/LTR direction for the on-screen content. */
  lang: LangCode
  /** Underlying vocabulary/story-word id, for weak-word tracking via the
      existing getAdaptiveWords()/weakWords mechanism - shared with every
      other language game, not a parallel tracking system. */
  sourceWordId: string
}

/** The 5 kinds that render as "pick one of N options" (vocabulary,
    listening, fill_blank, translation, multiple_choice, story = 6 actually,
    all sharing one UI). */
export interface ChoiceQuestion extends BaseQuestion {
  kind: 'vocabulary' | 'listening' | 'fill_blank' | 'translation' | 'multiple_choice' | 'story'
  promptEmoji?: string
  promptText: string
  /** When set, a 🔊 button (never autoplayed) speaks this text in promptSpeakLang. */
  promptSpeakText?: string
  promptSpeakLang?: LangCode
  storyTitle?: string
  options: { id: string; label: string }[]
  correctOptionId: string
}

export interface SpellingQuestion extends BaseQuestion {
  kind: 'spelling'
  promptEmoji?: string
  promptText: string
  promptSpeakText?: string
  promptSpeakLang?: LangCode
  correctAnswer: string
}

export interface ScrambleQuestion extends BaseQuestion {
  kind: 'scramble'
  promptText: string
  tokens: string[]
  correctOrder: string[]
}

export type Question = ChoiceQuestion | SpellingQuestion | ScrambleQuestion

export interface DailyChallengeProgress {
  /** 'YYYY-MM-DD' of the currently-active generated challenge. */
  date: string
  lang: LangCode
  level: ChallengeLevel
  autoLevel: boolean
  currentIndex: number
  /** Grows as the user answers; index i = whether question i was answered correctly. */
  answers: boolean[]
  /** sourceWordId of every question answered incorrectly, for "practice mistakes". */
  mistakeWordIds: string[]
  completed: boolean
  xpEarned: number
  /** Set only once completed - lets the results screen re-render correctly after a refresh. */
  perfect: boolean
}
