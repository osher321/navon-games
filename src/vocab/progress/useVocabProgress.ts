import { useCallback, useEffect, useRef, useState } from 'react'
import type { LevelNum } from '../data/types'
import type { VocabWord } from '../data/types'
import { MAX_LEVEL, TEST_PASS_PCT } from '../data/levels'
import { localStorageVocabStore } from './store'
import type { VocabProgressState } from './types'
import { applyAnswer, createWordStat } from './mastery'
import { XP_RULES } from './xp'
import { VOCAB_ACHIEVEMENTS, type VocabAchievementDef } from './achievements'

function todayStr(): string {
  return new Date().toISOString().slice(0, 10)
}

function checkNewAchievements(state: VocabProgressState): { achievements: string[]; newly: VocabAchievementDef[] } {
  let achievements = state.achievements
  const newly: VocabAchievementDef[] = []
  for (const a of VOCAB_ACHIEVEMENTS) {
    if (!achievements.includes(a.id) && a.check(state)) {
      achievements = [...achievements, a.id]
      newly.push(a)
    }
  }
  return { achievements, newly }
}

export interface VocabTestOutcome {
  passed: boolean
  scorePct: number
  unlockedLevel: LevelNum | null
}

/**
 * The single hook every screen in the academy talks to. Each mutation
 * method reads the current committed `progress` (safe here since every
 * call site is a single user action, never two mutators fired in the same
 * synchronous tick) and writes one fully-merged next state - avoiding the
 * stale-closure bugs that come from chaining several functional setState
 * updates in a row.
 */
export function useVocabProgress() {
  const [progress, setProgress] = useState<VocabProgressState>(() => localStorageVocabStore.load())
  const [pendingAchievements, setPendingAchievements] = useState<VocabAchievementDef[]>([])
  const comboRef = useRef(0)
  const dailyCheckedRef = useRef(false)

  useEffect(() => {
    localStorageVocabStore.save(progress)
  }, [progress])

  // Daily streak - runs once per academy visit. A gap of more than one day
  // resets the streak to 1 rather than 0: playing again after a break is
  // never punished, it's just a fresh count starting today.
  useEffect(() => {
    if (dailyCheckedRef.current) return
    dailyCheckedRef.current = true
    const today = todayStr()
    if (progress.lastPlayedDate === today) return
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
    const streak = progress.lastPlayedDate === yesterday ? progress.streak + 1 : 1
    const merged = { ...progress, streak, lastPlayedDate: today, xp: progress.xp + XP_RULES.dailyStreakBonus }
    const { achievements, newly } = checkNewAchievements(merged)
    if (newly.length) setPendingAchievements((prev) => [...prev, ...newly])
    setProgress({ ...merged, achievements })
    // Intentionally runs only once on mount - see dailyCheckedRef above.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const recordAnswer = useCallback(
    (word: VocabWord, correct: boolean, mode: 'normal' | 'speed' = 'normal') => {
      const prevStat = progress.wordStats[word.id] ?? createWordStat(word.id)
      const nextStat = applyAnswer(prevStat, correct)
      let xp = progress.xp
      let combo = comboRef.current
      if (correct) {
        xp += mode === 'speed' ? XP_RULES.speedChallengeAnswer : XP_RULES.correctAnswer
        combo += 1
        if (combo % XP_RULES.comboBonusEvery === 0) xp += XP_RULES.comboBonus
      } else {
        combo = 0
      }
      comboRef.current = combo
      const wordStats = { ...progress.wordStats, [word.id]: nextStat }
      const totalCorrect = progress.totalCorrect + (correct ? 1 : 0)
      const totalAnswered = progress.totalAnswered + 1
      const merged = { ...progress, xp, wordStats, totalCorrect, totalAnswered }
      const { achievements, newly } = checkNewAchievements(merged)
      if (newly.length) setPendingAchievements((prev) => [...prev, ...newly])
      setProgress({ ...merged, achievements })
    },
    [progress]
  )

  const recordGameComplete = useCallback(
    (correctCount: number, totalCount: number) => {
      const xp = progress.xp + XP_RULES.gameComplete
      const gamesCompleted = progress.gamesCompleted + 1
      const perfectRounds = progress.perfectRounds + (totalCount > 0 && correctCount === totalCount ? 1 : 0)
      const merged = { ...progress, xp, gamesCompleted, perfectRounds }
      const { achievements, newly } = checkNewAchievements(merged)
      if (newly.length) setPendingAchievements((prev) => [...prev, ...newly])
      setProgress({ ...merged, achievements })
    },
    [progress]
  )

  // Speed Challenge needs both the best-score update AND the game-complete
  // bookkeeping from one event - merged into a single mutation rather than
  // two calls, since two setProgress calls in the same tick would have the
  // second one read a stale (pre-first-update) `progress` closure.
  const recordSpeedChallengeComplete = useCallback(
    (correctCount: number, totalCount: number) => {
      const bestSpeedScore = Math.max(progress.bestSpeedScore, correctCount)
      const xp = progress.xp + XP_RULES.gameComplete
      const gamesCompleted = progress.gamesCompleted + 1
      const perfectRounds = progress.perfectRounds + (totalCount > 0 && correctCount === totalCount ? 1 : 0)
      const merged = { ...progress, xp, gamesCompleted, perfectRounds, bestSpeedScore }
      const { achievements, newly } = checkNewAchievements(merged)
      if (newly.length) setPendingAchievements((prev) => [...prev, ...newly])
      setProgress({ ...merged, achievements })
    },
    [progress]
  )

  const recordTestResult = useCallback(
    (level: LevelNum, correctCount: number, totalCount: number): VocabTestOutcome => {
      const scorePct = totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0
      const passed = scorePct >= TEST_PASS_PCT
      const alreadyPassed = progress.passedTests.includes(level)
      const nextLevel = (level + 1) as LevelNum
      const willUnlock = passed && nextLevel <= MAX_LEVEL && !progress.unlockedLevels.includes(nextLevel)
      const xp = progress.xp + (passed && !alreadyPassed ? XP_RULES.levelComplete : 0)
      const passedTests = passed && !alreadyPassed ? [...progress.passedTests, level] : progress.passedTests
      const unlockedLevels = willUnlock ? [...progress.unlockedLevels, nextLevel] : progress.unlockedLevels
      const merged = { ...progress, xp, passedTests, unlockedLevels }
      const { achievements, newly } = checkNewAchievements(merged)
      if (newly.length) setPendingAchievements((prev) => [...prev, ...newly])
      setProgress({ ...merged, achievements })
      return { passed, scorePct, unlockedLevel: willUnlock ? nextLevel : null }
    },
    [progress]
  )

  // Stories tracking is intentionally separate from XP/achievements/tests -
  // reading a story never awards XP or unlocks anything, it's pure
  // read/completed bookkeeping, so it can never interact with (or break)
  // the existing progress economy.
  const markStoryRead = useCallback(
    (storyId: string) => {
      if (progress.storiesRead.includes(storyId) && progress.lastStoryId === storyId) return
      const storiesRead = progress.storiesRead.includes(storyId) ? progress.storiesRead : [...progress.storiesRead, storyId]
      setProgress({ ...progress, storiesRead, lastStoryId: storyId })
    },
    [progress]
  )

  const markStoryCompleted = useCallback(
    (storyId: string) => {
      if (progress.storiesCompleted.includes(storyId)) return
      const storiesCompleted = [...progress.storiesCompleted, storyId]
      const storiesRead = progress.storiesRead.includes(storyId) ? progress.storiesRead : [...progress.storiesRead, storyId]
      setProgress({ ...progress, storiesCompleted, storiesRead, lastStoryId: storyId })
    },
    [progress]
  )

  const consumeAchievements = useCallback((): VocabAchievementDef[] => {
    if (pendingAchievements.length === 0) return []
    const list = pendingAchievements
    setPendingAchievements([])
    return list
  }, [pendingAchievements])

  const resetCombo = useCallback(() => {
    comboRef.current = 0
  }, [])

  return {
    progress,
    recordAnswer,
    recordGameComplete,
    recordSpeedChallengeComplete,
    recordTestResult,
    consumeAchievements,
    resetCombo,
    markStoryRead,
    markStoryCompleted,
  }
}
