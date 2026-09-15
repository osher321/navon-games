import type { Story, StoryVocabWord } from './types'
import { COMMON_WORDS } from './commonWords'
import { COMMON_WORDS_ES } from './commonWordsEs'
import { COMMON_WORDS_HE } from './commonWordsHe'
import { STORY_1 } from './story1'
import { STORY_2 } from './story2'
import { STORY_3 } from './story3'
import { STORY_4 } from './story4'
import { STORY_5 } from './story5'
import { STORY_6 } from './story6'
import { STORY_7 } from './story7'
import { STORY_8 } from './story8'
import { STORY_9 } from './story9'
import { STORY_10 } from './story10'
import { STORY_ES_1 } from './storyEs1'
import { STORY_ES_2 } from './storyEs2'
import { STORY_ES_3 } from './storyEs3'
import { STORY_ES_4 } from './storyEs4'
import { STORY_ES_5 } from './storyEs5'
import { STORY_ES_6 } from './storyEs6'
import { STORY_ES_7 } from './storyEs7'
import { STORY_ES_8 } from './storyEs8'
import { STORY_ES_9 } from './storyEs9'
import { STORY_ES_10 } from './storyEs10'
import { STORY_HE_1 } from './storyHe1'
import { STORY_HE_2 } from './storyHe2'
import { STORY_HE_3 } from './storyHe3'
import { STORY_HE_4 } from './storyHe4'
import { STORY_HE_5 } from './storyHe5'
import { STORY_HE_6 } from './storyHe6'
import { STORY_HE_7 } from './storyHe7'
import { STORY_HE_8 } from './storyHe8'
import { STORY_HE_9 } from './storyHe9'
import { STORY_HE_10 } from './storyHe10'
import { EXTRA_STORIES_EN } from './storiesEnExtra'
import { EXTRA_STORIES_ES } from './storiesEsExtra'
import { EXTRA_STORIES_HE } from './storiesHeExtra'

/** Adding an 11th story in an existing language - or a whole new language - is one more file, one more entry here, and (for a new language) one more common-words dictionary. Nothing else in the app needs to change. */
export const ALL_STORIES: Story[] = [
  STORY_1,
  STORY_2,
  STORY_3,
  STORY_4,
  STORY_5,
  STORY_6,
  STORY_7,
  STORY_8,
  STORY_9,
  STORY_10,
  STORY_ES_1,
  STORY_ES_2,
  STORY_ES_3,
  STORY_ES_4,
  STORY_ES_5,
  STORY_ES_6,
  STORY_ES_7,
  STORY_ES_8,
  STORY_ES_9,
  STORY_ES_10,
  STORY_HE_1,
  STORY_HE_2,
  STORY_HE_3,
  STORY_HE_4,
  STORY_HE_5,
  STORY_HE_6,
  STORY_HE_7,
  STORY_HE_8,
  STORY_HE_9,
  STORY_HE_10,
  ...EXTRA_STORIES_EN,
  ...EXTRA_STORIES_ES,
  ...EXTRA_STORIES_HE,
]

export function getStoryById(id: string): Story | undefined {
  return ALL_STORIES.find((s) => s.id === id)
}

export function getStoriesByLanguage(language: Story['language']): Story[] {
  return ALL_STORIES.filter((s) => s.language === language)
}

/** Per-language fallback dictionaries - keyed by the same `Story['language']` values used on the Story type itself, so a new language is one more entry here. */
const COMMON_WORDS_BY_LANGUAGE: Record<Story['language'], Map<string, StoryVocabWord>> = {
  en: COMMON_WORDS,
  es: COMMON_WORDS_ES,
  he: COMMON_WORDS_HE,
}

/**
 * Hebrew attaches single-letter grammatical prefixes (ו-/ה-/ב-/ל-/מ-/ש-/כ-
 * - "and", "the", "in", "to", "from", "that", "like") directly onto the
 * word that follows, with no space - so "מהברז" (from-the-faucet) is one
 * token, not three. Rather than hand-listing every prefixed variant of
 * every dictionary word (a combinatorial explosion), an unresolved Hebrew
 * word strips a leading prefix letter and retries the lookup - checking
 * the story's own vocabulary first, then the shared dictionary, same
 * priority as the unstripped word - recursing to unwrap stacked prefixes
 * like "וכשהגיע" (and-when-he-arrived). This only ever runs after the
 * exact word has already failed to match anything, so it can't shadow a
 * real dictionary entry that happens to start with one of these letters.
 */
const HEBREW_PREFIX_LETTERS = ['ו', 'ה', 'ב', 'ל', 'מ', 'ש', 'כ']
const HEBREW_PREFIX_STRIP_MAX_DEPTH = 4

function lookupHebrewWithPrefixStripping(story: Story, key: string, depth: number): StoryVocabWord | null {
  if (depth > HEBREW_PREFIX_STRIP_MAX_DEPTH) return null
  for (const prefix of HEBREW_PREFIX_LETTERS) {
    if (!key.startsWith(prefix) || key.length <= prefix.length + 1) continue
    const stripped = key.slice(prefix.length)
    const storyMatch = story.vocabulary.find((w) => w.word.toLowerCase() === stripped)
    if (storyMatch) return storyMatch
    const common = COMMON_WORDS_HE.get(stripped)
    if (common) return common
    const deeper = lookupHebrewWithPrefixStripping(story, stripped, depth + 1)
    if (deeper) return deeper
  }
  return null
}

/**
 * A story's own `vocabulary` takes priority (so a word that means something
 * different in this story's context - e.g. "close" as "near" rather than
 * "shut" - can override the shared dictionary), then falls back to the
 * shared common-words glossary for that story's own language, then (Hebrew
 * only) to prefix-stripped lookups. Returns null only if truly nothing
 * matches, which the UI turns into a graceful "no translation/explanation
 * available" message rather than an error.
 */
export function resolveWordTranslation(story: Story, rawWord: string): StoryVocabWord | null {
  const key = rawWord.toLowerCase()
  const storyMatch = story.vocabulary.find((w) => w.word.toLowerCase() === key)
  if (storyMatch) return storyMatch
  const common = COMMON_WORDS_BY_LANGUAGE[story.language].get(key)
  if (common) return common
  if (story.language === 'he') return lookupHebrewWithPrefixStripping(story, key, 0)
  return null
}

export type StoryToken = { type: 'word'; text: string; key: string } | { type: 'plain'; text: string }

/**
 * Splits one line into interactive word tokens and plain (whitespace/
 * punctuation) tokens. A "word" is a run of Unicode letters plus internal
 * apostrophes (so contractions like "didn't" and possessives like
 * "Sophie's" stay one clickable unit, and an accented word like "café" or
 * "año" tokenizes as one word instead of silently splitting on the accent)
 * - everything else (including Spanish ¿/¡) renders as plain, non-interactive
 * text. Hebrew letters are also `\p{L}`, so Hebrew words (including
 * attached prefixes like "ו"/"ה"/"ב"/"ל", which aren't separate tokens in
 * written Hebrew) tokenize the same way.
 */
export function tokenizeLine(line: string): StoryToken[] {
  const parts = line.match(/\p{L}+(?:'\p{L}+)?|[^\p{L}]+/gu) ?? []
  return parts.map((text) => (/\p{L}/u.test(text) ? { type: 'word', text, key: text.toLowerCase() } : { type: 'plain', text }))
}
