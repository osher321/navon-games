import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { LangCode, LevelId } from '../types'
import { getGameById, isGameAvailableForLang } from '../data/games'
import { useI18n } from '../i18n/LanguageContext'
import { useProgress } from '../hooks/useProgress'
import ResultOverlay from '../components/ResultOverlay'
import Breadcrumbs from '../components/Breadcrumbs'
import SEOHead from '../seo/SEOHead'
import { SITE_URL } from '../seo/config'
import type { GameFinishResult } from '../games/types'

import MemoryGame from '../games/MemoryGame'
import CatchStarsGame from '../games/CatchStarsGame'
import BalloonPopGame from '../games/BalloonPopGame'
import MazeGame from '../games/MazeGame'
import SpaceRaceGame from '../games/SpaceRaceGame'
import TargetHitGame from '../games/TargetHitGame'
import MathGame from '../games/MathGame'
import MultiplicationDivisionGame from '../games/MultiplicationDivisionGame'
import MultiplicationTableGame from '../games/MultiplicationTableGame'
import SudokuGame from '../games/SudokuGame'
import Game2048 from '../games/Game2048'
import NumberSequenceGame from '../games/NumberSequenceGame'
import OddOneOutGame from '../games/OddOneOutGame'
import NumbersGame from '../games/NumbersGame'
import FractionsGame from '../games/FractionsGame'
import ClockGame from '../games/ClockGame'
import MoneyGame from '../games/MoneyGame'
import GeometryGame from '../games/GeometryGame'
import WordProblemsGame from '../games/WordProblemsGame'
import LogicRiddlesGame from '../games/LogicRiddlesGame'
import MazeEscapeGame from '../games/MazeEscapeGame'
import FeedTheFishGame from '../games/FeedTheFishGame'
import MoneyGrabGame from '../games/MoneyGrabGame'
import CardWarGame from '../games/CardWarGame'
import SixtySecondChallengeGame from '../games/SixtySecondChallengeGame'

// The 3D arcade games pull in GTN's vehicle/camera/collision modules
// (Three.js-heavy code) - lazy-loading them here keeps that weight out of
// the main bundle exactly like GTN's own route already is, instead of
// every page paying for it just because GameScreen (used by every simple
// /play/:id game) would otherwise import them eagerly.
const CarRacingGame = lazy(() => import('../arcade3d/racing/CarRacingGame'))
const EndlessRunnerGame = lazy(() => import('../arcade3d/runner/EndlessRunnerGame'))
const NinjaRunnerGame = lazy(() => import('../arcade3d/runner/NinjaRunnerGame'))
const TreasureHuntGame = lazy(() => import('../arcade3d/treasure/TreasureHuntGame'))
const SoccerGame = lazy(() => import('../arcade3d/soccer/SoccerGame'))

function Arcade3DLoading() {
  const { tr } = useI18n()
  return (
    <div className="flex h-[50vh] items-center justify-center">
      <p className="font-fun font-extrabold text-ink/50">{tr('common_loading_game')}</p>
    </div>
  )
}
import HebrewLettersMemoryGame from '../games/HebrewLettersMemoryGame'
import WordImageMatchGame from '../games/WordImageMatchGame'
import ListeningGame from '../games/ListeningGame'
import VocabQuizGame from '../games/VocabQuizGame'
import SentenceScrambleGame from '../games/SentenceScrambleGame'
import WordMemoryGame from '../games/WordMemoryGame'

const LEVEL_DOT: Record<LevelId, string> = {
  beginner: '🟢',
  basic: '🟡',
  intermediate: '🟠',
  advanced: '🔴',
}

interface GameScreenProps {
  /** Set only by the dedicated /games/math route - overrides the :gameId URL param so that clean, canonical URL and the generic /play/:gameId path render the exact same game. */
  forcedGameId?: string
}

export default function GameScreen({ forcedGameId }: GameScreenProps) {
  const { gameId: paramGameId = '' } = useParams()
  const gameId = forcedGameId ?? paramGameId
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { tr } = useI18n()
  const { progress, recordGameResult } = useProgress()

  const game = getGameById(gameId)
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<{
    correct: number
    total: number
    xpEarned: number
    perfect: boolean
    newAchievements: string[]
    leveledUp: boolean
    best: number
    isNewBest: boolean
  } | null>(null)

  const lang = (searchParams.get('lang') as LangCode) || progress.selectedLanguage
  const level = useMemo<LevelId>(() => {
    const fromQuery = searchParams.get('level') as LevelId | null
    if (fromQuery) return fromQuery
    const unlocked = progress.languages[lang]?.unlockedLevels ?? ['beginner']
    return unlocked[unlocked.length - 1]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, lang])

  // Routes back to wherever this game is actually shelved under the new
  // fun/learning structure - language games still go to the language hub
  // as before, math/logic learning games go to their new sub-category
  // pages, and everything else (the true 🎮 fun games) goes to /games.
  const backTarget = !game
    ? '/games'
    : game.category === 'language' || game.learningSubcategory === 'language'
      ? '/learn-languages'
      : game.learningSubcategory === 'math'
        ? '/games/learning/math'
        : game.learningSubcategory === 'logic'
          ? '/games/learning/logic'
          : '/games'
  const isBlocked = !game || (game.category === 'language' && !isGameAvailableForLang(game, lang))

  // Redirects must happen as an effect, not during render - calling
  // navigate() synchronously in the render body doesn't reliably update
  // the route (React Router batches/discards it), which previously left
  // the page blank instead of actually redirecting.
  useEffect(() => {
    if (isBlocked) navigate(backTarget, { replace: true })
  }, [isBlocked, backTarget, navigate])

  const startTimeRef = useRef(Date.now())
  useEffect(() => {
    startTimeRef.current = Date.now()
  }, [round])

  if (!game || isBlocked) return null

  const handleFinish = (r: GameFinishResult) => {
    const durationSec = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
    const prevBest = progress.bestScores[game.id] ?? 0
    const { xpEarned, newAchievements, leveledUp } = recordGameResult({
      gameId: game.id,
      lang: game.category === 'language' ? lang : undefined,
      level: game.category === 'language' ? level : undefined,
      correct: r.correct,
      total: r.total,
      durationSec,
      missedWordIds: r.missedWordIds,
      learnedWordIds: r.learnedWordIds,
    })
    setResult({
      correct: r.correct,
      total: r.total,
      xpEarned,
      perfect: r.total > 0 && r.correct === r.total,
      newAchievements,
      leveledUp,
      best: Math.max(prevBest, r.correct),
      isNewBest: r.correct > prevBest,
    })
  }

  const renderGame = () => {
    switch (game.id) {
      case 'memory':
        return <MemoryGame key={round} onFinish={handleFinish} />
      case 'catch_stars':
        return <CatchStarsGame key={round} onFinish={handleFinish} />
      case 'balloon_pop':
        return <BalloonPopGame key={round} onFinish={handleFinish} />
      case 'maze':
        return <MazeGame key={round} onFinish={handleFinish} />
      case 'space_race':
        return <SpaceRaceGame key={round} onFinish={handleFinish} />
      case 'target_hit':
        return <TargetHitGame key={round} onFinish={handleFinish} />
      case 'math_addition_subtraction':
        return <MathGame key={round} onFinish={handleFinish} />
      case 'multiplication_division':
        return <MultiplicationDivisionGame key={round} onFinish={handleFinish} />
      case 'multiplication_table':
        return <MultiplicationTableGame key={round} onFinish={handleFinish} />
      case 'sudoku':
        return <SudokuGame key={round} onFinish={handleFinish} />
      case 'game_2048':
        return <Game2048 key={round} onFinish={handleFinish} />
      case 'number_sequence':
        return <NumberSequenceGame key={round} onFinish={handleFinish} />
      case 'odd_one_out':
        return <OddOneOutGame key={round} onFinish={handleFinish} />
      case 'numbers_game':
        return <NumbersGame key={round} onFinish={handleFinish} />
      case 'fractions':
        return <FractionsGame key={round} onFinish={handleFinish} />
      case 'clock_time':
        return <ClockGame key={round} onFinish={handleFinish} />
      case 'money_shopping':
        return <MoneyGame key={round} onFinish={handleFinish} />
      case 'geometry':
        return <GeometryGame key={round} onFinish={handleFinish} />
      case 'word_problems':
        return <WordProblemsGame key={round} onFinish={handleFinish} />
      case 'logic_riddles':
        return <LogicRiddlesGame key={round} onFinish={handleFinish} />
      case 'car_racing':
        return (
          <Suspense fallback={<Arcade3DLoading />}>
            <CarRacingGame key={round} onFinish={handleFinish} />
          </Suspense>
        )
      case 'endless_runner':
        return (
          <Suspense fallback={<Arcade3DLoading />}>
            <EndlessRunnerGame key={round} onFinish={handleFinish} />
          </Suspense>
        )
      case 'ninja_runner':
        return (
          <Suspense fallback={<Arcade3DLoading />}>
            <NinjaRunnerGame key={round} onFinish={handleFinish} />
          </Suspense>
        )
      case 'treasure_hunt':
        return (
          <Suspense fallback={<Arcade3DLoading />}>
            <TreasureHuntGame key={round} onFinish={handleFinish} />
          </Suspense>
        )
      case 'soccer':
        return (
          <Suspense fallback={<Arcade3DLoading />}>
            <SoccerGame key={round} onFinish={handleFinish} />
          </Suspense>
        )
      case 'maze_escape':
        return <MazeEscapeGame key={round} onFinish={handleFinish} />
      case 'feed_the_fish':
        return <FeedTheFishGame key={round} onFinish={handleFinish} />
      case 'money_grab':
        return <MoneyGrabGame key={round} onFinish={handleFinish} />
      case 'card_war':
        return <CardWarGame key={round} onFinish={handleFinish} />
      case 'sixty_second_challenge':
        return <SixtySecondChallengeGame key={round} onFinish={handleFinish} />
      case 'hebrew_memory':
        return <HebrewLettersMemoryGame key={round} onFinish={handleFinish} />
      case 'word_image':
        return <WordImageMatchGame key={round} lang={lang} level={level} onFinish={handleFinish} />
      case 'listening':
        return <ListeningGame key={round} lang={lang} level={level} onFinish={handleFinish} />
      case 'vocab_quiz':
        return <VocabQuizGame key={round} lang={lang} level={level} onFinish={handleFinish} />
      case 'sentence_scramble':
        return <SentenceScrambleGame key={round} lang={lang} level={level} onFinish={handleFinish} />
      case 'word_memory':
        return <WordMemoryGame key={round} lang={lang} level={level} onFinish={handleFinish} />
      default:
        return null
    }
  }

  // Educational games get grade/topic-targeted SEO copy (per the explicit
  // "SEO לפי כיתות ונושאים" requirement for this category) instead of the
  // generic formula every other simple game falls back to below.
  const EDU_SEO: Record<string, { title: string; description: string; breadcrumbLabel: string; canonicalPath: string; about: string }> = {
    math_addition_subtraction: {
      title: 'משחק חשבון לילדים - חיבור וחיסור לכיתות א׳ ב׳ ג׳ | נבון משחקים',
      description: 'משחק חשבון אונליין בחינם לתרגול חיבור וחיסור, עם רמות קושי לכיתה א׳, כיתה ב׳ וכיתה ג׳. תרגילי חשבון לילדים בצורה כיפית, ישירות בדפדפן.',
      breadcrumbLabel: 'חשבון – חיבור וחיסור',
      canonicalPath: '/games/math',
      about: 'חיבור וחיסור',
    },
    multiplication_division: {
      title: 'משחק כפל וחילוק לילדים - תרגול לוח הכפל | נבון משחקים',
      description: 'משחק חשבון לתרגול כפל וחילוק, עם רמות קושי לכיתה א׳, כיתה ב׳ וכיתה ג׳. תרגילי כפל וחילוק לילדים, ישירות בדפדפן ובחינם.',
      breadcrumbLabel: 'כפל וחילוק',
      canonicalPath: '/play/multiplication_division',
      about: 'כפל וחילוק',
    },
    multiplication_table: {
      title: 'תרגול לוח הכפל 1-10 לילדים | נבון משחקים',
      description: 'תרגלו את לוח הכפל בצורה אינטראקטיבית - בחרו לוח מ-1 עד 10, ענו על שאלות ברצף ובנו רצף תשובות נכונות. מתאים לתרגול יומי לילדים.',
      breadcrumbLabel: 'לוח הכפל',
      canonicalPath: '/play/multiplication_table',
      about: 'לוח הכפל',
    },
  }
  const eduSeo = EDU_SEO[game.id]
  const gameName = tr(game.nameKey)
  const gameDesc = tr(game.descKey)
  const seoTitle = eduSeo ? eduSeo.title : `${gameName} - משחק ${game.category === 'language' ? 'לימוד שפות' : 'אונליין'} בחינם | נבון משחקים`
  const seoDescription = eduSeo ? eduSeo.description : `${gameDesc} שחקו בדפדפן, בחינם, במחשב או בנייד.`
  const eduJsonLd = eduSeo && {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: eduSeo.breadcrumbLabel,
    description: seoDescription,
    learningResourceType: 'Practice problems',
    educationalUse: 'practice',
    about: eduSeo.about,
    url: `${SITE_URL}${eduSeo.canonicalPath}`,
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24">
      {/* Math is reachable at both /games/math (the canonical, SEO-facing
          URL) and /play/math_addition_subtraction (the generic route every
          simple game shares) - always self-canonicalize to the former so
          Google indexes one URL for this game instead of two near-duplicate
          pages. */}
      <SEOHead title={seoTitle} description={seoDescription} path={eduSeo ? eduSeo.canonicalPath : location.pathname} jsonLd={eduJsonLd || undefined} />
      {eduSeo && (
        <>
          <Breadcrumbs
            items={[
              { label: tr('nav_home'), href: '/' },
              { label: tr('cat_learning_games'), href: '/games/learning' },
              { label: `🧮 ${tr('learning_math_title')}`, href: '/games/learning/math' },
              { label: eduSeo.breadcrumbLabel },
            ]}
          />
          <p className="mb-4 text-center text-sm text-ink/60">{eduSeo.description}</p>
        </>
      )}
      <div className="mb-5 flex items-center justify-between">
        <button
          onClick={() => navigate(backTarget)}
          className="flex items-center gap-1 rounded-full bg-white px-4 py-2 font-fun font-bold text-ink shadow-card card-outline btn-pressable"
        >
          <span className="flip-x">⬅️</span> {tr('back')}
        </button>
        <div className="text-center">
          <h1 className="font-fun text-xl font-extrabold text-grape-600">
            {game.icon} {tr(game.nameKey)}
          </h1>
          {game.category === 'language' && (
            <p className="text-xs font-bold text-ink/40">
              {LEVEL_DOT[level]} {tr(`level_${level}`)}
            </p>
          )}
        </div>
        <div className="w-[84px]" />
      </div>

      {renderGame()}

      {result && (
        <ResultOverlay
          correct={result.correct}
          total={result.total}
          xpEarned={result.xpEarned}
          perfect={result.perfect}
          newAchievements={result.newAchievements}
          leveledUp={result.leveledUp}
          best={result.best}
          isNewBest={result.isNewBest}
          onPlayAgain={() => {
            setResult(null)
            setRound((r) => r + 1)
          }}
          onBack={() => navigate(backTarget)}
        />
      )}
    </div>
  )
}
