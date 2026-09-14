import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { LevelNum, VocabWord } from './data/types'
import { getWordsByLevel, shuffle, ALL_WORDS } from './data/words'
import { TEST_QUESTION_COUNT } from './data/levels'
import { GAME_TYPES, SESSION_SIZE, type GameTypeId } from './games/registry'
import type { VocabGameSummary } from './games/types'
import { pickSessionWords, pickWeakWords } from './progress/mastery'
import { useVocabProgress, type VocabTestOutcome } from './progress/useVocabProgress'
import { XP_RULES } from './progress/xp'
import type { VocabAchievementDef } from './progress/achievements'
import { useVocabSpeech } from './audio'
import Dashboard from './ui/Dashboard'
import GameMenu from './ui/GameMenu'
import GameShell from './ui/GameShell'
import ResultsScreen from './ui/ResultsScreen'
import TestResultsScreen from './ui/TestResultsScreen'
import AchievementToast from './ui/AchievementToast'
import Breadcrumbs from '../components/Breadcrumbs'
import SEOHead from '../seo/SEOHead'
import { SITE_URL } from '../seo/config'

type PlayOrigin = { type: 'level'; level: LevelNum; gameType: GameTypeId } | { type: 'review' }

type Phase =
  | { name: 'dashboard' }
  | { name: 'gameMenu'; level: LevelNum }
  | { name: 'playing'; origin: PlayOrigin; words: VocabWord[] }
  | { name: 'results'; origin: PlayOrigin; correct: number; total: number; xpEarned: number; elapsedSec?: number }
  | { name: 'testPlaying'; level: LevelNum; words: VocabWord[] }
  | { name: 'testResults'; level: LevelNum; outcome: VocabTestOutcome }

export default function VocabAcademyPage() {
  const navigate = useNavigate()
  const {
    progress,
    recordAnswer,
    recordGameComplete,
    recordSpeedChallengeComplete,
    recordTestResult,
    consumeAchievements,
    resetCombo,
  } = useVocabProgress()
  const { speak, canSpeak } = useVocabSpeech()

  const [phase, setPhase] = useState<Phase>({ name: 'dashboard' })
  const [achievementQueue, setAchievementQueue] = useState<VocabAchievementDef[]>([])
  const [activeAchievement, setActiveAchievement] = useState<VocabAchievementDef | null>(null)
  const sessionXpRef = useRef(0)
  const sessionComboRef = useRef(0)

  // Drains newly-earned achievements into the display queue after every
  // progress mutation - this also covers the daily-streak bonus achievement
  // check that fires once on mount, since `progress` changes then too.
  useEffect(() => {
    const newly = consumeAchievements()
    if (newly.length) setAchievementQueue((q) => [...q, ...newly])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [progress, consumeAchievements])

  useEffect(() => {
    if (!activeAchievement && achievementQueue.length > 0) {
      setActiveAchievement(achievementQueue[0])
      setAchievementQueue((q) => q.slice(1))
    }
  }, [achievementQueue, activeAchievement])

  useEffect(() => {
    if (!activeAchievement) return
    const t = setTimeout(() => setActiveAchievement(null), 3200)
    return () => clearTimeout(t)
  }, [activeAchievement])

  const weakWordPool = useMemo(() => {
    const inReach = ALL_WORDS.filter((w) => progress.unlockedLevels.includes(w.level))
    return pickWeakWords(inReach, progress)
  }, [progress])

  const beginSession = () => {
    resetCombo()
    sessionXpRef.current = 0
    sessionComboRef.current = 0
  }

  const handleAnswer = (word: VocabWord, correct: boolean, mode: 'normal' | 'speed' = 'normal') => {
    recordAnswer(word, correct, mode)
    if (correct) {
      sessionXpRef.current += mode === 'speed' ? XP_RULES.speedChallengeAnswer : XP_RULES.correctAnswer
      sessionComboRef.current += 1
      if (sessionComboRef.current % XP_RULES.comboBonusEvery === 0) sessionXpRef.current += XP_RULES.comboBonus
    } else {
      sessionComboRef.current = 0
    }
  }

  const startLevelGame = (level: LevelNum, gameType: GameTypeId) => {
    beginSession()
    const pool = getWordsByLevel(level)
    const words = gameType === 'speed_challenge' ? shuffle(pool) : pickSessionWords(pool, progress, SESSION_SIZE)
    setPhase({ name: 'playing', origin: { type: 'level', level, gameType }, words })
  }

  const startReviewMistakes = () => {
    beginSession()
    const words = shuffle(weakWordPool).slice(0, Math.min(SESSION_SIZE, weakWordPool.length))
    setPhase({ name: 'playing', origin: { type: 'review' }, words })
  }

  const startTest = (level: LevelNum) => {
    const pool = getWordsByLevel(level)
    const words = shuffle(pool).slice(0, Math.min(TEST_QUESTION_COUNT, pool.length))
    setPhase({ name: 'testPlaying', level, words })
  }

  const handleGameFinish = (summary: VocabGameSummary) => {
    if (phase.name !== 'playing') return
    const { origin } = phase
    if (origin.type === 'level' && origin.gameType === 'speed_challenge') {
      recordSpeedChallengeComplete(summary.correct, summary.total)
    } else {
      recordGameComplete(summary.correct, summary.total)
    }
    const xpEarned = sessionXpRef.current + XP_RULES.gameComplete
    setPhase({ name: 'results', origin, correct: summary.correct, total: summary.total, xpEarned, elapsedSec: summary.elapsedSec })
  }

  const handleTestFinish = (summary: VocabGameSummary) => {
    if (phase.name !== 'testPlaying') return
    const outcome = recordTestResult(phase.level, summary.correct, summary.total)
    setPhase({ name: 'testResults', level: phase.level, outcome })
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: 'אוצר מילים באנגלית - נבון משחקים',
    description: 'לימוד אוצר מילים באנגלית לפי רמות, באמצעות משחקים ותרגול אינטראקטיבי.',
    inLanguage: 'en',
    learningResourceType: 'Vocabulary course',
    url: `${SITE_URL}/games/vocab-academy`,
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-24">
      <SEOHead
        title="אוצר מילים באנגלית לפי רמות | נבון משחקים"
        description="למדו אוצר מילים באנגלית בצורה מהנה - 6 רמות לפי CEFR, מבחני רמה ומשחקי תרגול (בחירה מרובה, התאמת מילים, השלמת משפטים, האזנה, איות ואתגר מהירות)."
        path="/games/vocab-academy"
        jsonLd={jsonLd}
      />
      <Breadcrumbs
        items={[
          { label: 'דף הבית', href: '/' },
          { label: 'משחקים בשביל ללמוד', href: '/games/learning' },
          { label: 'לומדים שפות', href: '/learn-languages' },
          { label: 'אוצר מילים באנגלית' },
        ]}
      />

      <AchievementToast achievement={activeAchievement} />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-fun text-2xl font-extrabold text-ink">🎓 אוצר מילים באנגלית</h1>
          <p className="text-xs font-bold text-ink/50">English Vocabulary Academy</p>
        </div>
        <button
          onClick={() => navigate('/learn-languages')}
          className="rounded-full bg-white px-4 py-2 font-fun text-sm font-extrabold text-ink shadow-card card-outline btn-pressable"
        >
          ✕ יציאה
        </button>
      </div>

      {phase.name === 'dashboard' && (
        <Dashboard
          progress={progress}
          hasWeakWords={weakWordPool.length > 0}
          onSelectLevel={(level) => setPhase({ name: 'gameMenu', level })}
          onReviewMistakes={startReviewMistakes}
        />
      )}

      {phase.name === 'gameMenu' && (
        <GameMenu
          level={phase.level}
          testPassed={progress.passedTests.includes(phase.level)}
          onSelectGame={(gameType) => startLevelGame(phase.level, gameType)}
          onStartTest={() => startTest(phase.level)}
          onBack={() => setPhase({ name: 'dashboard' })}
        />
      )}

      {phase.name === 'playing' &&
        (() => {
          const origin = phase.origin
          const gameDef = origin.type === 'level' ? GAME_TYPES.find((g) => g.id === origin.gameType)! : null
          const GameComponent = gameDef?.component ?? GAME_TYPES[0].component
          const title = origin.type === 'review' ? '🎯 תרגול מילים שטעיתם בהן' : `${gameDef!.icon} ${gameDef!.title}`
          const subtitle = origin.type === 'level' ? `Level ${origin.level}` : undefined
          return (
            <GameShell title={title} subtitle={subtitle} onExit={() => setPhase(origin.type === 'level' ? { name: 'gameMenu', level: origin.level } : { name: 'dashboard' })}>
              <GameComponent words={phase.words} onAnswer={handleAnswer} onFinish={handleGameFinish} speak={speak} canSpeak={canSpeak} />
            </GameShell>
          )
        })()}

      {phase.name === 'testPlaying' &&
        (() => {
          const MultipleChoiceGame = GAME_TYPES[0].component
          return (
            <GameShell title="🎯 מבחן רמה" subtitle={`Level ${phase.level}`} onExit={() => setPhase({ name: 'gameMenu', level: phase.level })}>
              <MultipleChoiceGame words={phase.words} onAnswer={handleAnswer} onFinish={handleTestFinish} speak={speak} canSpeak={canSpeak} />
            </GameShell>
          )
        })()}

      {phase.name === 'results' &&
        (() => {
          // Snapshotting into a local const so the discriminated-union
          // narrowing below survives into the closures passed as props -
          // narrowing a nested property access (phase.origin.type) does not
          // reliably persist into a callback the way narrowing a plain
          // local variable does.
          const origin = phase.origin
          return (
            <ResultsScreen
              correct={phase.correct}
              total={phase.total}
              xpEarned={phase.xpEarned}
              elapsedSec={phase.elapsedSec}
              onPlayAgain={() => (origin.type === 'level' ? startLevelGame(origin.level, origin.gameType) : startReviewMistakes())}
              onBackToMenu={() => setPhase(origin.type === 'level' ? { name: 'gameMenu', level: origin.level } : { name: 'dashboard' })}
            />
          )
        })()}

      {phase.name === 'testResults' && (
        <TestResultsScreen
          level={phase.level}
          outcome={phase.outcome}
          onRetry={() => startTest(phase.level)}
          onBackToMenu={() => setPhase({ name: 'gameMenu', level: phase.level })}
          onGoToNextLevel={() => setPhase({ name: 'gameMenu', level: phase.outcome.unlockedLevel ?? phase.level })}
        />
      )}
    </div>
  )
}
