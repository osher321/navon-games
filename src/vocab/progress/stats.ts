import type { LevelNum } from '../data/types'
import { getLevel } from '../data/levels'
import { getWordsByLevel } from '../data/words'
import type { VocabProgressState } from './types'

export function getWordsLearnedCount(progress: VocabProgressState): number {
  return Object.values(progress.wordStats).filter((s) => s.timesCorrect >= 1).length
}

export function getWordsMasteredCount(progress: VocabProgressState): number {
  return Object.values(progress.wordStats).filter((s) => s.mastered).length
}

export function getAccuracyPct(progress: VocabProgressState): number {
  return progress.totalAnswered > 0 ? Math.round((progress.totalCorrect / progress.totalAnswered) * 100) : 0
}

/** CEFR label for the dashboard ("English Level: B1") - the highest level the learner has unlocked so far. */
export function getEnglishLevelLabel(progress: VocabProgressState): string {
  const highest = Math.max(...progress.unlockedLevels) as LevelNum
  return getLevel(highest).cefr
}

/** % of a level's words the learner has gotten right at least once - drives that level's progress bar. */
export function getLevelProgressPct(progress: VocabProgressState, level: LevelNum): number {
  const words = getWordsByLevel(level)
  if (!words.length) return 0
  const learned = words.filter((w) => (progress.wordStats[w.id]?.timesCorrect ?? 0) >= 1).length
  return Math.round((learned / words.length) * 100)
}
