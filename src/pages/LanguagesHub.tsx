import { useMemo, useState } from 'react'
import type { LevelId } from '../types'
import { LEVELS } from '../types'
import { useI18n } from '../i18n/LanguageContext'
import { useProgress } from '../hooks/useProgress'
import { languageGamesFor, STORY_GAMES } from '../data/games'
import LanguageSelector from '../components/LanguageSelector'
import LevelSelector from '../components/LevelSelector'
import GameGrid from '../components/GameGrid'
import ProgressBar from '../components/ProgressBar'

export default function LanguagesHub() {
  const { tr } = useI18n()
  const { progress, setSelectedLanguage } = useProgress()
  const lang = progress.selectedLanguage
  const langProgress = progress.languages[lang]

  const [level, setLevel] = useState<LevelId>(() => langProgress.unlockedLevels[langProgress.unlockedLevels.length - 1])

  const currentLevelIdx = LEVELS.findIndex((l) => l.id === level)
  const nextLevel = LEVELS[currentLevelIdx + 1]
  const currentReq = LEVELS[currentLevelIdx].xpRequired
  const nextReq = nextLevel ? nextLevel.xpRequired : currentReq + 1

  const hrefFor = useMemo(
    () => (game: { id: string }) => {
      // Both the vocabulary academy and the stories feature are standalone
      // areas with their own internal navigation (not a LanguageGameProps
      // component GameScreen can render), so they get their own route
      // instead of the generic /play/:gameId one every other language game
      // shares. Stories reuses that same route/page/progress store with a
      // query param that opens straight to the story list - no separate
      // page or duplicated Stories implementation.
      if (game.id === 'vocab_academy') return '/games/vocab-academy'
      if (game.id === 'stories_academy_he') return '/games/vocab-academy?view=stories&storyLang=he'
      if (game.id === 'stories_academy') return '/games/vocab-academy?view=stories&storyLang=en'
      if (game.id === 'stories_academy_es') return '/games/vocab-academy?view=stories&storyLang=es'
      return `/play/${game.id}?lang=${lang}&level=${level}`
    },
    [lang, level]
  )

  const availableGames = useMemo(() => languageGamesFor(lang), [lang])

  const handleLangChange = (l: typeof lang) => {
    setSelectedLanguage(l)
    const lp = progress.languages[l]
    setLevel(lp.unlockedLevels[lp.unlockedLevels.length - 1])
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24">
      <h1 className="mb-2 text-center font-fun text-3xl font-extrabold text-grape-600">{tr('language_games_title')}</h1>
      <p className="mb-6 text-center text-ink/50">{tr('choose_language')}</p>

      <LanguageSelector value={lang} onChange={handleLangChange} />

      <p className="mb-3 mt-8 text-center text-ink/50">{tr('choose_level')}</p>
      <LevelSelector value={level} onChange={setLevel} unlockedLevels={langProgress.unlockedLevels} />

      <div className="mx-auto mt-6 max-w-sm">
        <ProgressBar value={langProgress.xp - currentReq} max={Math.max(1, nextReq - currentReq)} colorFrom="from-sunny-400" colorTo="to-candy-400" showLabel />
        <p className="mt-1 text-center text-xs font-bold text-ink/40">
          {langProgress.xp} {tr('xp')} {nextLevel ? `· ${nextReq - langProgress.xp > 0 ? nextReq - langProgress.xp : 0} → ${tr(`level_${nextLevel.id}`)}` : ''}
        </p>
      </div>

      <div className="mt-10">
        <GameGrid games={availableGames} hrefFor={hrefFor} />
      </div>

      {/* Stories (📖 סיפורים) is a sibling section of the language
          selector/grid above, not one of its filtered entries - it always
          shows all 3 language cards regardless of which language is
          currently selected up top. */}
      <div className="mt-10">
        <h2 className="mb-1 text-center font-fun text-2xl font-extrabold text-grape-600">📖 סיפורים</h2>
        <p className="mb-4 text-center text-ink/50">בחרו שפה כדי לקרוא סיפורים קצרים ואינטראקטיביים</p>
        <GameGrid games={STORY_GAMES} hrefFor={hrefFor} />
      </div>
    </div>
  )
}
