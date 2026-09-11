import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import type { LangCode, LevelId } from '../types'
import { getGameById, isGameAvailableForLang } from '../data/games'
import { useI18n } from '../i18n/LanguageContext'
import { useProgress } from '../hooks/useProgress'
import ResultOverlay from '../components/ResultOverlay'
import type { GameFinishResult } from '../games/types'

import MemoryGame from '../games/MemoryGame'
import CatchStarsGame from '../games/CatchStarsGame'
import BalloonPopGame from '../games/BalloonPopGame'
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

export default function GameScreen() {
  const { gameId = '' } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { tr } = useI18n()
  const { progress, recordGameResult } = useProgress()

  const game = getGameById(gameId)
  const [round, setRound] = useState(0)
  const [result, setResult] = useState<{ correct: number; total: number; xpEarned: number; perfect: boolean; newAchievements: string[]; leveledUp: boolean } | null>(null)

  const lang = (searchParams.get('lang') as LangCode) || progress.selectedLanguage
  const level = useMemo<LevelId>(() => {
    const fromQuery = searchParams.get('level') as LevelId | null
    if (fromQuery) return fromQuery
    const unlocked = progress.languages[lang]?.unlockedLevels ?? ['beginner']
    return unlocked[unlocked.length - 1]
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams, lang])

  const backTarget = !game ? '/games' : game.category === 'language' ? '/languages' : '/games'
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24">
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
