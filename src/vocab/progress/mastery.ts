import type { VocabWord } from '../data/types'
import { shuffle } from '../data/words'
import type { VocabProgressState, WordStat } from './types'

export const MASTERY_STREAK = 3

export function isMastered(stat: WordStat): boolean {
  return stat.consecutiveCorrect >= MASTERY_STREAK
}

/** Days until this word should resurface - a light spaced-repetition curve: wrong or new = now, then 1 / 3 / 7 / 14 days as the streak grows. */
function reviewIntervalDays(consecutiveCorrect: number, mastered: boolean): number {
  if (mastered) return 14
  if (consecutiveCorrect <= 0) return 0
  if (consecutiveCorrect === 1) return 1
  if (consecutiveCorrect === 2) return 3
  return 7
}

export function createWordStat(wordId: string): WordStat {
  const now = new Date().toISOString()
  return { wordId, timesSeen: 0, timesCorrect: 0, timesWrong: 0, consecutiveCorrect: 0, mastered: false, nextReviewAt: now, lastSeenAt: now }
}

export function applyAnswer(stat: WordStat, correct: boolean): WordStat {
  const now = new Date()
  const next: WordStat = {
    ...stat,
    timesSeen: stat.timesSeen + 1,
    timesCorrect: stat.timesCorrect + (correct ? 1 : 0),
    timesWrong: stat.timesWrong + (correct ? 0 : 1),
    consecutiveCorrect: correct ? stat.consecutiveCorrect + 1 : 0,
    lastSeenAt: now.toISOString(),
  }
  next.mastered = isMastered(next)
  const days = reviewIntervalDays(next.consecutiveCorrect, next.mastered)
  const reviewDate = new Date(now)
  reviewDate.setDate(reviewDate.getDate() + days)
  next.nextReviewAt = reviewDate.toISOString()
  return next
}

/** A word is "weak" once it's been seen and is either net-wrong or hasn't been gotten right yet - the pool behind "תרגל את המילים שבהן טעית". */
export function isWeak(stat: WordStat | undefined): boolean {
  if (!stat || stat.timesSeen === 0) return false
  return stat.timesWrong > stat.timesCorrect || stat.consecutiveCorrect === 0
}

export function pickWeakWords(words: VocabWord[], progress: VocabProgressState): VocabWord[] {
  return words.filter((w) => isWeak(progress.wordStats[w.id]))
}

/**
 * Builds a practice session pool of `count` words from `words`, biased
 * toward due-for-review and weak words first, then never-seen words, then
 * whatever's left - so struggling words resurface without ever leaving a
 * session short if the level doesn't have many of them yet.
 */
export function pickSessionWords(words: VocabWord[], progress: VocabProgressState, count: number): VocabWord[] {
  const now = Date.now()
  const due: VocabWord[] = []
  const unseen: VocabWord[] = []
  const rest: VocabWord[] = []
  for (const w of words) {
    const stat = progress.wordStats[w.id]
    if (!stat) unseen.push(w)
    else if (isWeak(stat) || new Date(stat.nextReviewAt).getTime() <= now) due.push(w)
    else rest.push(w)
  }
  const ordered = [...shuffle(due), ...shuffle(unseen), ...shuffle(rest)]
  return ordered.slice(0, Math.min(count, ordered.length))
}
