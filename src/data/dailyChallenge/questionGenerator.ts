import type { LangCode, VocabItem, SentenceItem } from '../../types'
import { VOCABULARY, vocabByLevelAndLang } from '../vocabulary'
import { SENTENCES, sentencesByLevel } from '../sentences'
import { getStoriesByLanguage } from '../../vocab/data/stories'
import type { Story, StoryLanguage, StoryLevel } from '../../vocab/data/stories/types'
import type { ChallengeLevel, Question, QuestionKind } from './types'
import { QUESTION_KIND_ORDER, mapToSiteLevel } from './types'

export const QUESTIONS_PER_CHALLENGE = 20

/** Small, dependency-free deterministic PRNG (mulberry32) - the entire
    point is that the SAME (date, lang, level) seed always produces the
    SAME sequence of "random" picks, so a page refresh mid-challenge never
    regenerates different questions, but a new calendar day (different
    seed) does. Math.random() cannot be used anywhere in this file. */
function mulberry32(seed: number) {
  let a = seed
  return function rng() {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function seedFromString(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0
  }
  return h >>> 0
}

function seededShuffle<T>(arr: T[], rng: () => number): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pick<T>(arr: T[], rng: () => number): T | undefined {
  if (arr.length === 0) return undefined
  return arr[Math.floor(rng() * arr.length)]
}

function seededDistractors(pool: VocabItem[], excludeId: string, count: number, rng: () => number): VocabItem[] {
  const others = pool.filter((v) => v.id !== excludeId)
  return seededShuffle(others, rng).slice(0, count)
}

const STORY_LEVEL_FOR_CHALLENGE: Record<ChallengeLevel, StoryLevel> = {
  beginner: 'beginner',
  basic: 'elementary',
  intermediate: 'intermediate',
  advanced: 'upper_intermediate',
  expert: 'advanced',
}

function todayYMD(d = new Date()): string {
  return d.toISOString().slice(0, 10)
}

function referenceLangFor(lang: LangCode): LangCode {
  return lang === 'he' ? 'en' : 'he'
}

// The stories feature only has he/en/es content (see StoryLanguage) - 'ar'
// simply has no story pool, so 'story' questions fall back to vocabulary
// for that language instead of the generator ever needing 'ar' stories.
function storiesFor(lang: LangCode): Story[] {
  if (lang === 'he' || lang === 'en' || lang === 'es') return getStoriesByLanguage(lang as StoryLanguage)
  return []
}

function buildVocabularyQuestion(id: string, item: VocabItem, pool: VocabItem[], lang: LangCode, rng: () => number): Question {
  const ref = referenceLangFor(lang)
  const distractors = seededDistractors(pool, item.id, 3, rng)
  const options = seededShuffle(
    [item, ...distractors].map((v) => ({ id: v.id, label: v.text[lang] })),
    rng
  )
  return {
    id,
    kind: 'vocabulary',
    lang,
    sourceWordId: item.id,
    promptEmoji: item.emoji,
    promptText: item.text[ref],
    options,
    correctOptionId: item.id,
  }
}

function buildTranslationQuestion(id: string, item: VocabItem, pool: VocabItem[], lang: LangCode, rng: () => number): Question {
  const ref = referenceLangFor(lang)
  const distractors = seededDistractors(pool, item.id, 3, rng)
  const options = seededShuffle(
    [item, ...distractors].map((v) => ({ id: v.id, label: v.text[ref] })),
    rng
  )
  return {
    id,
    kind: 'translation',
    lang,
    sourceWordId: item.id,
    promptEmoji: item.emoji,
    promptText: item.text[lang],
    promptSpeakText: item.text[lang],
    promptSpeakLang: lang,
    options,
    correctOptionId: item.id,
  }
}

function buildMultipleChoiceQuestion(id: string, item: VocabItem, pool: VocabItem[], lang: LangCode, rng: () => number): Question {
  const ref = referenceLangFor(lang)
  const distractors = seededDistractors(pool, item.id, 3, rng)
  const options = seededShuffle(
    [item, ...distractors].map((v) => ({ id: v.id, label: v.text[lang] })),
    rng
  )
  return {
    id,
    kind: 'multiple_choice',
    lang,
    sourceWordId: item.id,
    promptText: item.text[ref],
    options,
    correctOptionId: item.id,
  }
}

function buildListeningQuestion(id: string, item: VocabItem, pool: VocabItem[], lang: LangCode, rng: () => number): Question {
  const ref = referenceLangFor(lang)
  const distractors = seededDistractors(pool, item.id, 3, rng)
  const options = seededShuffle(
    [item, ...distractors].map((v) => ({ id: v.id, label: v.text[ref] })),
    rng
  )
  return {
    id,
    kind: 'listening',
    lang,
    sourceWordId: item.id,
    promptEmoji: '🔊',
    promptText: '',
    promptSpeakText: item.text[lang],
    promptSpeakLang: lang,
    options,
    correctOptionId: item.id,
  }
}

function buildSpellingQuestion(id: string, item: VocabItem, lang: LangCode, rng: () => number): Question {
  void rng
  const ref = referenceLangFor(lang)
  return {
    id,
    kind: 'spelling',
    lang,
    sourceWordId: item.id,
    promptEmoji: item.emoji,
    promptText: item.text[ref],
    correctAnswer: item.text[lang],
  }
}

function buildFillBlankQuestion(id: string, sentence: SentenceItem, vocabPool: VocabItem[], lang: LangCode, rng: () => number): Question | null {
  const tokens = sentence.text[lang]
  if (!tokens || tokens.length < 2) return null
  const blankIndex = Math.floor(rng() * tokens.length)
  const correctWord = tokens[blankIndex]
  const distractorWords = seededShuffle(
    vocabPool.map((v) => v.text[lang]).filter((w) => w.toLowerCase() !== correctWord.toLowerCase()),
    rng
  ).slice(0, 3)
  const displayTokens = tokens.map((t, i) => (i === blankIndex ? '____' : t))
  const options = seededShuffle(
    [correctWord, ...distractorWords].map((w, i) => ({ id: `${id}-opt${i}`, label: w })),
    rng
  )
  const correctOpt = options.find((o) => o.label === correctWord)!
  return {
    id,
    kind: 'fill_blank',
    lang,
    sourceWordId: `sentence:${sentence.id}`,
    promptText: displayTokens.join(' '),
    options,
    correctOptionId: correctOpt.id,
  }
}

function buildScrambleQuestion(id: string, sentence: SentenceItem, lang: LangCode, rng: () => number): Question | null {
  const tokens = sentence.text[lang]
  if (!tokens || tokens.length < 2) return null
  const ref = referenceLangFor(lang)
  return {
    id,
    kind: 'scramble',
    lang,
    sourceWordId: `sentence:${sentence.id}`,
    promptText: sentence.text[ref]?.join(' ') ?? '',
    tokens: seededShuffle(tokens, rng),
    correctOrder: tokens,
  }
}

function buildStoryQuestion(id: string, stories: Story[], lang: LangCode, rng: () => number): Question | null {
  const withVocab = stories.filter((s) => s.vocabulary.length >= 2)
  const story = pick(withVocab, rng)
  if (!story) return null
  const entry = pick(story.vocabulary, rng)
  if (!entry) return null
  const otherWords = story.vocabulary.filter((w) => w.word !== entry.word)
  const distractorPool = otherWords.length >= 3 ? otherWords : story.vocabulary
  const distractors = seededShuffle(distractorPool, rng)
    .filter((w) => w.word !== entry.word)
    .slice(0, 3)
    .map((w) => w.translation)
  // pad with vocabulary-pool distractors if a story doesn't have enough of its own words
  while (distractors.length < 3) {
    const extra = pick(VOCABULARY, rng)
    if (extra && !distractors.includes(extra.text.he)) distractors.push(extra.text.he)
  }
  const options = seededShuffle(
    [entry.translation, ...distractors].map((label, i) => ({ id: `${id}-opt${i}`, label })),
    rng
  )
  const correctOpt = options.find((o) => o.label === entry.translation)!
  return {
    id,
    kind: 'story',
    lang,
    sourceWordId: `story:${story.id}:${entry.word}`,
    promptText: entry.word,
    promptSpeakText: entry.word,
    promptSpeakLang: lang,
    storyTitle: story.title,
    options,
    correctOptionId: correctOpt.id,
  }
}

/**
 * Deterministically generates exactly QUESTIONS_PER_CHALLENGE questions,
 * cycling through all 8 requested question kinds, for a given calendar day
 * + language + level. Calling this again with the same 3 inputs (e.g. on
 * page refresh) always returns the identical question set - a new day
 * (different `date`) or a different lang/level produces a different one.
 */
export function generateDailyQuestions(date: string, lang: LangCode, level: ChallengeLevel): Question[] {
  const siteLevel = mapToSiteLevel(level)
  const storyLevel = STORY_LEVEL_FOR_CHALLENGE[level]
  const vocabPool = vocabByLevelAndLang(siteLevel) as VocabItem[]
  const sentencePool = sentencesByLevel(siteLevel) as SentenceItem[]
  const storyPool = storiesFor(lang).filter((s) => s.level === storyLevel)
  const fallbackVocabPool = vocabPool.length >= 4 ? vocabPool : VOCABULARY
  const fallbackSentencePool = sentencePool.length >= 1 ? sentencePool : SENTENCES

  const rng = mulberry32(seedFromString(`${date}|${lang}|${level}`))
  const questions: Question[] = []
  let guard = 0

  while (questions.length < QUESTIONS_PER_CHALLENGE && guard < QUESTIONS_PER_CHALLENGE * 6) {
    guard++
    const kind: QuestionKind = QUESTION_KIND_ORDER[questions.length % QUESTION_KIND_ORDER.length]
    const qid = `dc-${date}-${lang}-${level}-${questions.length}`
    let q: Question | null = null

    if (kind === 'vocabulary') {
      const item = pick(fallbackVocabPool, rng)
      if (item) q = buildVocabularyQuestion(qid, item, fallbackVocabPool, lang, rng)
    } else if (kind === 'translation') {
      const item = pick(fallbackVocabPool, rng)
      if (item) q = buildTranslationQuestion(qid, item, fallbackVocabPool, lang, rng)
    } else if (kind === 'multiple_choice') {
      const item = pick(fallbackVocabPool, rng)
      if (item) q = buildMultipleChoiceQuestion(qid, item, fallbackVocabPool, lang, rng)
    } else if (kind === 'listening') {
      const item = pick(fallbackVocabPool, rng)
      if (item) q = buildListeningQuestion(qid, item, fallbackVocabPool, lang, rng)
    } else if (kind === 'spelling') {
      const item = pick(fallbackVocabPool, rng)
      if (item) q = buildSpellingQuestion(qid, item, lang, rng)
    } else if (kind === 'fill_blank') {
      const sentence = pick(fallbackSentencePool, rng)
      if (sentence) q = buildFillBlankQuestion(qid, sentence, fallbackVocabPool, lang, rng)
    } else if (kind === 'scramble') {
      const sentence = pick(fallbackSentencePool, rng)
      if (sentence) q = buildScrambleQuestion(qid, sentence, lang, rng)
    } else if (kind === 'story') {
      q = buildStoryQuestion(qid, storyPool.length ? storyPool : storiesFor(lang), lang, rng)
      // a language with too few stories at this level falls back to a
      // vocabulary question instead of ever leaving a gap in the 20.
      if (!q) {
        const item = pick(fallbackVocabPool, rng)
        if (item) q = buildVocabularyQuestion(qid, item, fallbackVocabPool, lang, rng)
      }
    }

    if (q) questions.push(q)
  }

  return questions
}

export { todayYMD }
