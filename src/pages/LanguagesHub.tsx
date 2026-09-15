import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import type { LangCode, LevelId } from '../types'
import { LEVELS } from '../types'
import { useI18n } from '../i18n/LanguageContext'
import { useProgress } from '../hooks/useProgress'
import { languageGamesFor, STORY_GAMES } from '../data/games'
import LanguageSelector from '../components/LanguageSelector'
import LevelSelector from '../components/LevelSelector'
import GameGrid from '../components/GameGrid'
import ProgressBar from '../components/ProgressBar'
import Breadcrumbs from '../components/Breadcrumbs'
import SEOHead from '../seo/SEOHead'
import { SITE_URL } from '../seo/config'
import { SLUG_TO_LANG, LANG_TO_SLUG } from '../seo/languageSlugs'
import { LANG_META } from '../i18n/translations'

const HREF_FOR_STORY_GAME: Record<string, string> = {
  stories_academy_he: '/learn-languages/stories/hebrew',
  stories_academy: '/learn-languages/stories/english',
  stories_academy_es: '/learn-languages/stories/spanish',
}

// SEO title/description stay Hebrew-authored (this route is prerendered
// once per language slug, not per interface-language) - the visible intro
// below reacts to the interface language via introKey instead.
const SEO_COPY: Record<'general' | 'english' | 'spanish' | 'hebrew', { title: string; description: string }> = {
  general: {
    title: 'לומדים שפות במשחק - עברית, אנגלית וספרדית | נבון משחקים',
    description: 'למדו שפות בצורה מהנה: משחקי אנגלית וספרדית, אוצר מילים לפי רמות וסיפורים אינטראקטיביים - מתאים לילדים ולכל המשפחה.',
  },
  english: {
    title: 'לימוד אנגלית לילדים - משחקים ואוצר מילים | נבון משחקים',
    description: 'לימוד אנגלית לילדים בצורה מהנה: משחקי אנגלית, תרגול אוצר מילים באנגלית לפי רמות וסיפורים קצרים באנגלית עם הגייה.',
  },
  spanish: {
    title: 'לימוד ספרדית למתחילים - משחקים ואוצר מילים | נבון משחקים',
    description: 'לימוד ספרדית למתחילים בצורה מהנה: משחקי ספרדית, תרגול אוצר מילים בספרדית וסיפורים קצרים בספרדית עם הגייה.',
  },
  hebrew: {
    title: 'משחקי עברית ולימוד שפות | נבון משחקים',
    description: 'משחקי עברית לתרגול שפה, לצד לימוד אנגלית וספרדית - הכל במקום אחד ובאמצעות משחק.',
  },
}

const UI_COPY: Record<'general' | 'english' | 'spanish' | 'hebrew', { introKey: string }> = {
  general: { introKey: 'languages_hub_general_intro' },
  english: { introKey: 'languages_hub_english_intro' },
  spanish: { introKey: 'languages_hub_spanish_intro' },
  hebrew: { introKey: 'languages_hub_hebrew_intro' },
}

export default function LanguagesHub() {
  const { tr } = useI18n()
  const navigate = useNavigate()
  const { langSlug } = useParams<{ langSlug?: string }>()
  const { progress, setSelectedLanguage } = useProgress()
  const lang = progress.selectedLanguage

  // A language segment in the URL (/learn-languages/english) is the
  // SEO-crawlable, shareable entry point for that language area - it drives
  // the selected-language client state on load so the page content matches
  // the URL, the same way the in-page selector drives it during a session.
  const paramLang = langSlug ? SLUG_TO_LANG[langSlug] : undefined
  useEffect(() => {
    if (paramLang && paramLang !== lang) setSelectedLanguage(paramLang)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramLang])

  const langProgress = progress.languages[lang]
  const [level, setLevel] = useState<LevelId>(() => langProgress.unlockedLevels[langProgress.unlockedLevels.length - 1])

  const currentLevelIdx = LEVELS.findIndex((l) => l.id === level)
  const nextLevel = LEVELS[currentLevelIdx + 1]
  const currentReq = LEVELS[currentLevelIdx].xpRequired
  const nextReq = nextLevel ? nextLevel.xpRequired : currentReq + 1

  const hrefFor = useMemo(
    () => (game: { id: string }) => {
      // The vocabulary academy is a standalone area with its own internal
      // navigation (not a LanguageGameProps component GameScreen can
      // render), so it gets its own route instead of the generic
      // /play/:gameId one every other language game shares. Stories live at
      // their own dedicated, crawlable routes (see StoriesHubPage/
      // StoriesListPage/StoryReaderPage) rather than inside this hub.
      if (game.id === 'vocab_academy') return '/games/vocab-academy'
      if (game.id in HREF_FOR_STORY_GAME) return HREF_FOR_STORY_GAME[game.id]
      return `/play/${game.id}?lang=${lang}&level=${level}`
    },
    [lang, level]
  )

  const availableGames = useMemo(() => languageGamesFor(lang), [lang])

  const handleLangChange = (l: LangCode) => {
    // 'ar' can never reach here - the site-wide LanguageSelector default
    // (['he','en','es']) is the only list rendered on this page, and Arabic
    // was removed as a selectable/visible language everywhere - but the
    // fallback keeps this exhaustive for LangCode's wider type.
    const slug = LANG_TO_SLUG[l as 'he' | 'en' | 'es'] ?? 'hebrew'
    navigate(`/learn-languages/${slug}`)
  }

  const copyKey = langSlug === 'english' ? 'english' : langSlug === 'spanish' ? 'spanish' : langSlug === 'hebrew' ? 'hebrew' : 'general'
  const seo = SEO_COPY[copyKey]
  const ui = UI_COPY[copyKey]
  const path = langSlug ? `/learn-languages/${langSlug}` : '/learn-languages'
  // The language's own native-script name (e.g. "English") doubles as the
  // breadcrumb label for its hub page - reactive by construction, no
  // separate per-language breadcrumb translation keys needed.
  const breadcrumbLabel = langSlug && paramLang ? LANG_META[paramLang].native : undefined

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: seo.title,
    description: seo.description,
    url: `${SITE_URL}${path}`,
    inLanguage: 'he',
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24">
      <SEOHead title={seo.title} description={seo.description} path={path} jsonLd={jsonLd} />
      <Breadcrumbs
        items={
          breadcrumbLabel
            ? [
                { label: tr('nav_home'), href: '/' },
                { label: tr('cat_learning_games'), href: '/games/learning' },
                { label: tr('cat_languages'), href: '/learn-languages' },
                { label: breadcrumbLabel },
              ]
            : [{ label: tr('nav_home'), href: '/' }, { label: tr('cat_learning_games'), href: '/games/learning' }, { label: tr('cat_languages') }]
        }
      />

      <h1 className="mb-2 text-center font-fun text-3xl font-extrabold text-grape-600">{tr('language_games_title')}</h1>
      <p className="mx-auto mb-6 max-w-xl text-center text-sm text-ink/60">{tr(ui.introKey)}</p>

      {/* Stories (📖 סיפורים) is a sibling section of the language
          selector/grid below, not one of its filtered entries - it always
          shows all 3 language cards regardless of which language is
          currently selected further down. */}
      <div>
        <h2 className="mb-1 text-center font-fun text-2xl font-extrabold text-grape-600">📖 {tr('cat_stories')}</h2>
        <p className="mb-4 text-center text-ink/50">{tr('stories_choose_lang_hint')}</p>
        <GameGrid games={STORY_GAMES} hrefFor={hrefFor} />
      </div>

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
    </div>
  )
}
