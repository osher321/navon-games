import { useMemo } from 'react'
import { useProgress } from './useProgress'
import type { LangCode } from '../types'
import { LEVELS } from '../types'
import type { ChallengeLevel, DailyChallengeProgress, Question } from '../data/dailyChallenge/types'
import { generateDailyQuestions, QUESTIONS_PER_CHALLENGE, todayYMD } from '../data/dailyChallenge/questionGenerator'

/** Picks a ChallengeLevel from the learner's EXISTING per-language progress
    (unlockedLevels + xp) - the "✨ auto-match my level" option. Real, if
    simple, personalization from data the site already tracks; the
    generator itself documents where finer per-question-type weighting
    (weak vocabulary vs. weak listening, etc.) would plug in later. */
function autoDetectLevel(lang: LangCode, progress: ReturnType<typeof useProgress>['progress']): ChallengeLevel {
  const langProgress = progress.languages[lang]
  const order = LEVELS.map((l) => l.id)
  const highestUnlocked = order.filter((l) => langProgress.unlockedLevels.includes(l)).pop() ?? 'beginner'
  if (highestUnlocked === 'advanced' && langProgress.xp >= 1200) return 'expert'
  return highestUnlocked as ChallengeLevel
}

export function useDailyChallenge() {
  const { progress, setDailyChallenge, completeDailyChallenge } = useProgress()
  const today = todayYMD()

  const challenge = progress.dailyChallenge
  // "Today's challenge" only counts as active if it was actually generated
  // today - a stale challenge from a previous day (e.g. right after
  // midnight, before the user has picked anything again) is treated as
  // absent, never silently reused or auto-regenerated on read.
  const isTodayActive = !!challenge && challenge.date === today

  const questions: Question[] = useMemo(() => {
    if (!isTodayActive || !challenge) return []
    return generateDailyQuestions(challenge.date, challenge.lang, challenge.level)
  }, [isTodayActive, challenge])

  const suggestedLevel = (lang: LangCode) => autoDetectLevel(lang, progress)

  const startChallenge = (lang: LangCode, level: ChallengeLevel, autoLevel: boolean) => {
    // Resuming the exact same day+lang+level challenge (e.g. navigating
    // back to the page) must not reset progress already made today.
    if (isTodayActive && challenge!.lang === lang && challenge!.level === level) return
    const fresh: DailyChallengeProgress = {
      date: today,
      lang,
      level,
      autoLevel,
      currentIndex: 0,
      answers: [],
      mistakeWordIds: [],
      completed: false,
      xpEarned: 0,
      perfect: false,
    }
    setDailyChallenge(fresh)
  }

  const submitAnswer = (isCorrect: boolean, sourceWordId: string) => {
    if (!challenge) return
    const answers = [...challenge.answers, isCorrect]
    const mistakeWordIds = isCorrect ? challenge.mistakeWordIds : [...challenge.mistakeWordIds, sourceWordId]
    setDailyChallenge({ ...challenge, answers, mistakeWordIds, currentIndex: challenge.currentIndex + 1 })
  }

  const finishChallenge = (durationSec: number) => {
    if (!challenge) return null
    const correct = challenge.answers.filter(Boolean).length
    const total = challenge.answers.length || QUESTIONS_PER_CHALLENGE
    const perfect = correct === total
    const result = completeDailyChallenge({ lang: challenge.lang, correct, total, durationSec })
    setDailyChallenge({ ...challenge, completed: true, xpEarned: result.xpEarned, perfect })
    return { ...result, correct, total, perfect }
  }

  /** Re-enters a short focused session covering only the questions the
      learner got wrong today (📖 section 9's "practice mistakes"), reusing
      the exact same Question shape/UI - not a separate mini-game system. */
  const mistakeQuestions: Question[] = useMemo(() => {
    if (!challenge || challenge.mistakeWordIds.length === 0) return []
    const ids = new Set(challenge.mistakeWordIds)
    return questions.filter((q) => ids.has(q.sourceWordId))
  }, [challenge, questions])

  return {
    today,
    challenge,
    isTodayActive,
    questions,
    mistakeQuestions,
    suggestedLevel,
    startChallenge,
    submitAnswer,
    finishChallenge,
    streak: progress.dailyChallengeStreak,
    bestStreak: progress.dailyChallengeBestStreak,
    totalCompleted: progress.dailyChallengeTotalCompleted,
    completedToday: progress.dailyChallengeLastCompletedDate === today,
  }
}
