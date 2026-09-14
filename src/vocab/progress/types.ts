import type { LevelNum } from '../data/types'

export interface WordStat {
  wordId: string
  timesSeen: number
  timesCorrect: number
  timesWrong: number
  /** Correct answers in a row, right now - resets to 0 on any wrong answer. Drives both mastery and the spaced-repetition interval. */
  consecutiveCorrect: number
  mastered: boolean
  /** ISO date string - when this word should resurface in a session again. */
  nextReviewAt: string
  lastSeenAt: string
}

export interface VocabProgressState {
  xp: number
  unlockedLevels: LevelNum[]
  /** Levels whose test has been passed at least once (>= TEST_PASS_PCT). */
  passedTests: LevelNum[]
  wordStats: Record<string, WordStat>
  achievements: string[]
  streak: number
  lastPlayedDate: string | null
  totalCorrect: number
  totalAnswered: number
  gamesCompleted: number
  perfectRounds: number
  /** Best number of correct answers in a single Speed Challenge run. */
  bestSpeedScore: number
  /** Story ids opened at least once. */
  storiesRead: string[]
  /** Story ids explicitly marked as finished. */
  storiesCompleted: string[]
  lastStoryId: string | null
  createdAt: number
}

export function createDefaultVocabProgress(): VocabProgressState {
  return {
    xp: 0,
    unlockedLevels: [1],
    passedTests: [],
    wordStats: {},
    achievements: [],
    streak: 0,
    lastPlayedDate: null,
    totalCorrect: 0,
    totalAnswered: 0,
    gamesCompleted: 0,
    perfectRounds: 0,
    bestSpeedScore: 0,
    storiesRead: [],
    storiesCompleted: [],
    lastStoryId: null,
    createdAt: Date.now(),
  }
}
