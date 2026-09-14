import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import type { ChildProfile, GameResult, LangCode, LanguageProgress, LevelId, ProgressState } from '../types'
import { LEVELS } from '../types'
import { ACHIEVEMENTS } from '../data/achievements'

const STORAGE_KEY = 'navon-mishakim-progress-v1'

const AVATARS = ['🦁', '🐼', '🦊', '🐸', '🦄', '🐨', '🐵', '🐯']

function emptyLanguageProgress(): LanguageProgress {
  return {
    xp: 0,
    unlockedLevels: ['beginner'],
    wordsLearned: [],
    weakWords: {},
    gamesPlayed: 0,
    bestScores: {},
  }
}

function createDefaultProgress(): ProgressState {
  return {
    profile: { name: '', avatar: AVATARS[0] },
    totalXP: 0,
    stars: 0,
    trophies: 0,
    streak: 0,
    lastPlayedDate: null,
    gamesPlayedTotal: 0,
    selectedLanguage: 'en',
    interfaceLanguage: 'he',
    languages: {
      he: emptyLanguageProgress(),
      en: emptyLanguageProgress(),
      ar: emptyLanguageProgress(),
      es: emptyLanguageProgress(),
    },
    achievements: [],
    recentGames: [],
    bestScores: {},
    soundOn: true,
    lastGameId: null,
    createdAt: Date.now(),
  }
}

function loadProgress(): ProgressState {
  if (typeof window === 'undefined') return createDefaultProgress()
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return createDefaultProgress()
    const parsed = JSON.parse(raw)
    const base = createDefaultProgress()
    return {
      ...base,
      ...parsed,
      profile: { ...base.profile, ...parsed.profile },
      languages: {
        he: { ...emptyLanguageProgress(), ...parsed.languages?.he },
        en: { ...emptyLanguageProgress(), ...parsed.languages?.en },
        ar: { ...emptyLanguageProgress(), ...parsed.languages?.ar },
        es: { ...emptyLanguageProgress(), ...parsed.languages?.es },
      },
    }
  } catch {
    return createDefaultProgress()
  }
}

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function yesterdayStr() {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

function unlockLevelsForXP(xp: number): LevelId[] {
  return LEVELS.filter((l) => xp >= l.xpRequired).map((l) => l.id)
}

interface RecordGameOptions {
  gameId: string
  lang?: LangCode
  level?: LevelId
  correct: number
  total: number
  durationSec: number
  missedWordIds?: string[]
  learnedWordIds?: string[]
}

interface ProgressContextValue {
  progress: ProgressState
  addXP: (amount: number) => void
  recordGameResult: (opts: RecordGameOptions) => { xpEarned: number; newAchievements: string[]; leveledUp: boolean }
  setSelectedLanguage: (lang: LangCode) => void
  toggleSound: () => void
  updateProfile: (profile: Partial<ChildProfile>) => void
  resetProgress: () => void
  getAdaptiveWords: (lang: LangCode, level: LevelId, pool: string[], count: number) => string[]
  avatars: string[]
}

const ProgressContext = createContext<ProgressContextValue | null>(null)

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressState>(() => loadProgress())

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    } catch {
      // storage unavailable - ignore, progress stays in-memory for this session
    }
  }, [progress])

  const addXP = useCallback((amount: number) => {
    setProgress((prev) => ({ ...prev, totalXP: prev.totalXP + amount, stars: prev.stars + Math.floor(amount / 10) }))
  }, [])

  // Deliberately does NOT touch interfaceLanguage - the site's UI language
  // and the language the learner is studying are two independent concepts
  // (a Hebrew-speaking learner studying English still wants Hebrew menus,
  // buttons, and instructions). See i18n/LanguageContext.tsx, which pins
  // the interface to Hebrew regardless of this value.
  const setSelectedLanguage = useCallback((lang: LangCode) => {
    setProgress((prev) => ({ ...prev, selectedLanguage: lang }))
  }, [])

  const toggleSound = useCallback(() => {
    setProgress((prev) => ({ ...prev, soundOn: !prev.soundOn }))
  }, [])

  const updateProfile = useCallback((profile: Partial<ChildProfile>) => {
    setProgress((prev) => ({ ...prev, profile: { ...prev.profile, ...profile } }))
  }, [])

  const resetProgress = useCallback(() => {
    setProgress(createDefaultProgress())
  }, [])

  const getAdaptiveWords = useCallback(
    (lang: LangCode, _level: LevelId, pool: string[], count: number) => {
      const langProg = progress.languages[lang]
      const weak = [...pool].sort((a, b) => (langProg.weakWords[b] ?? 0) - (langProg.weakWords[a] ?? 0))
      const weakOnes = weak.filter((id) => (langProg.weakWords[id] ?? 0) > 0)
      const rest = pool.filter((id) => !weakOnes.includes(id)).sort(() => Math.random() - 0.5)
      const combined = [...weakOnes, ...rest]
      return combined.slice(0, count)
    },
    [progress.languages]
  )

  const recordGameResult = useCallback((opts: RecordGameOptions) => {
    let xpEarned = 0
    let newAchievements: string[] = []
    let leveledUp = false

    setProgress((prev) => {
      const accuracy = opts.total > 0 ? opts.correct / opts.total : 0
      const perfect = opts.total > 0 && opts.correct === opts.total

      xpEarned = opts.correct * 10 + (perfect ? 100 : 0) + (accuracy >= 0.7 && !perfect ? 20 : 0)

      const result: GameResult = {
        gameId: opts.gameId,
        lang: opts.lang,
        level: opts.level,
        xpEarned,
        correct: opts.correct,
        total: opts.total,
        perfect,
        playedAt: Date.now(),
        durationSec: opts.durationSec,
        missedWords: opts.missedWordIds,
      }

      const isToday = prev.lastPlayedDate === todayStr()
      const isYesterday = prev.lastPlayedDate === yesterdayStr()
      const streak = isToday ? prev.streak : isYesterday ? prev.streak + 1 : 1

      let languages = prev.languages
      if (opts.lang) {
        const langProg = { ...prev.languages[opts.lang] }
        langProg.xp += xpEarned
        langProg.gamesPlayed += 1
        const prevBest = langProg.bestScores[opts.gameId] ?? 0
        langProg.bestScores = { ...langProg.bestScores, [opts.gameId]: Math.max(prevBest, opts.correct) }

        const prevUnlocked = langProg.unlockedLevels
        const nextUnlocked = unlockLevelsForXP(langProg.xp)
        leveledUp = nextUnlocked.length > prevUnlocked.length
        langProg.unlockedLevels = nextUnlocked

        if (opts.learnedWordIds?.length) {
          const set = new Set([...langProg.wordsLearned, ...opts.learnedWordIds])
          langProg.wordsLearned = Array.from(set)
        }

        const weakWords = { ...langProg.weakWords }
        opts.missedWordIds?.forEach((id) => {
          weakWords[id] = (weakWords[id] ?? 0) + 1
        })
        opts.learnedWordIds?.forEach((id) => {
          if (weakWords[id]) weakWords[id] = Math.max(0, weakWords[id] - 1)
        })
        langProg.weakWords = weakWords

        languages = { ...prev.languages, [opts.lang]: langProg }
      }

      const prevBestGlobal = prev.bestScores[opts.gameId] ?? 0

      const nextState: ProgressState = {
        ...prev,
        totalXP: prev.totalXP + xpEarned,
        stars: prev.stars + Math.floor(xpEarned / 10),
        trophies: prev.trophies + (perfect ? 1 : 0),
        streak,
        lastPlayedDate: todayStr(),
        gamesPlayedTotal: prev.gamesPlayedTotal + 1,
        languages,
        recentGames: [result, ...prev.recentGames].slice(0, 30),
        bestScores: { ...prev.bestScores, [opts.gameId]: Math.max(prevBestGlobal, opts.correct) },
        lastGameId: opts.gameId,
      }

      const unlocked = new Set(nextState.achievements)
      ACHIEVEMENTS.forEach((a) => {
        if (!unlocked.has(a.id) && a.check(nextState)) {
          unlocked.add(a.id)
          newAchievements.push(a.id)
        }
      })
      nextState.achievements = Array.from(unlocked)

      return nextState
    })

    return { xpEarned, newAchievements, leveledUp }
  }, [])

  const value: ProgressContextValue = {
    progress,
    addXP,
    recordGameResult,
    setSelectedLanguage,
    toggleSound,
    updateProfile,
    resetProgress,
    getAdaptiveWords,
    avatars: AVATARS,
  }

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}

export function useProgress() {
  const ctx = useContext(ProgressContext)
  if (!ctx) throw new Error('useProgress must be used inside ProgressProvider')
  return ctx
}
