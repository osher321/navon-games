import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useI18n } from '../i18n/LanguageContext'
import { useProgress } from '../hooks/useProgress'
import { ALL_GAMES, EVERY_GAME, getGameById, isGameAvailableForLang } from '../data/games'
import GameCard from '../components/GameCard'
import GameGrid from '../components/GameGrid'
import LanguageSelector from '../components/LanguageSelector'
import UiLanguageSelector from '../components/UiLanguageSelector'
import SEOHead from '../seo/SEOHead'
import { SITE_URL, SITE_NAME } from '../seo/config'

interface HomeCardDef {
  key: string
  icon: string
  color: string
  to: string
}

const HOME_CARDS: HomeCardDef[] = [
  { key: 'card_games', icon: '🎮', color: 'from-candy-400 to-candy-500', to: '/games' },
  { key: 'card_languages', icon: '📚', color: 'from-sky-400 to-sky-500', to: '/games/learning' },
  { key: 'card_achievements', icon: '🏆', color: 'from-sunny-400 to-sunny-500', to: '/achievements' },
  { key: 'card_points', icon: '⭐', color: 'from-grass-400 to-grass-500', to: '/profile' },
  { key: 'card_streak', icon: '🔥', color: 'from-grape-400 to-grape-500', to: '/profile' },
  { key: 'card_profile', icon: '👦', color: 'from-candy-400 to-grape-400', to: '/profile' },
]

const STORY_HREF: Record<string, string> = {
  stories_academy_he: '/learn-languages/stories/hebrew',
  stories_academy: '/learn-languages/stories/english',
  stories_academy_es: '/learn-languages/stories/spanish',
}

function hrefForGame(g: { id: string }): string {
  if (g.id === 'math_addition_subtraction') return '/games/math'
  if (g.id === 'vocab_academy') return '/games/vocab-academy'
  if (g.id in STORY_HREF) return STORY_HREF[g.id]
  return `/play/${g.id}`
}

const MotionLink = motion(Link)

type SectionFilter = 'all' | 'fun' | 'learning'

export default function Home() {
  const { tr } = useI18n()
  const { progress, setSelectedLanguage } = useProgress()

  const lang = progress.selectedLanguage
  const availableGames = useMemo(() => ALL_GAMES.filter((g) => isGameAvailableForLang(g, lang)), [lang])
  const popularGames = useMemo(() => availableGames.slice(0, 4), [availableGames])
  const newGames = useMemo(() => availableGames.filter((g) => g.isNew), [availableGames])
  const lastGame = progress.lastGameId ? getGameById(progress.lastGameId) : undefined
  const continueGame = lastGame && isGameAvailableForLang(lastGame, lang) ? lastGame : undefined

  const recommended = useMemo(() => {
    const played = new Set(progress.recentGames.map((g) => g.gameId))
    const notPlayed = availableGames.filter((g) => !played.has(g.id))
    return (notPlayed.length ? notPlayed : availableGames).slice(0, 4)
  }, [progress.recentGames, availableGames])

  const [searchQuery, setSearchQuery] = useState('')
  const [sectionFilter, setSectionFilter] = useState<SectionFilter>('all')
  const isSearchActive = searchQuery.trim().length > 0 || sectionFilter !== 'all'
  const searchResults = useMemo(() => {
    if (!isSearchActive) return []
    const q = searchQuery.trim()
    return EVERY_GAME.filter((g) => {
      if (sectionFilter !== 'all' && g.section !== sectionFilter) return false
      if (!q) return true
      return tr(g.nameKey).includes(q)
      // eslint-disable-next-line react-hooks/exhaustive-deps
    })
  }, [searchQuery, sectionFilter, isSearchActive])

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    inLanguage: 'he',
    description: 'משחקים מהנים וחינוכיים לילדים ולמשפחה - משחקי חשבון, משחקי אנגלית וספרדית, אוצר מילים וסיפורים אינטראקטיביים, בדפדפן ובחינם.',
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24">
      <SEOHead
        title="נבון משחקים - משחקים חינוכיים לילדים בחינם | חשבון, אנגלית וספרדית"
        description="משחקים מהנים וחינוכיים לילדים ולכל המשפחה, ישירות בדפדפן ובחינם: משחקי חשבון (חיבור וחיסור), משחקי אנגלית וספרדית, אוצר מילים וסיפורים אינטראקטיביים - מתאים למחשב ולטלפון."
        path="/"
        jsonLd={jsonLd}
      />
      <motion.section
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative mb-10 overflow-hidden rounded-blob bg-gradient-to-br from-grape-500 via-candy-500 to-sunny-400 px-6 py-10 text-center text-white shadow-pop"
      >
        <div className="pointer-events-none absolute -top-6 left-6 text-5xl opacity-70 animate-floaty">🎈</div>
        <div className="pointer-events-none absolute top-8 right-8 text-5xl opacity-70 animate-floaty" style={{ animationDelay: '1s' }}>
          ⭐
        </div>
        <div className="pointer-events-none absolute bottom-3 left-1/4 text-4xl opacity-60 animate-floaty" style={{ animationDelay: '2s' }}>
          🚀
        </div>
        <div className="text-6xl">{progress.profile.avatar || '🦁'}</div>
        <h1 className="mt-3 font-fun text-3xl font-extrabold sm:text-4xl">{tr('home_hero_title')}</h1>
        <p className="mt-2 text-white/90">{tr('home_hero_sub')}</p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-full bg-white/20 px-4 py-2 font-fun font-bold backdrop-blur">⭐ {progress.stars} {tr('stars')}</span>
          <span className="rounded-full bg-white/20 px-4 py-2 font-fun font-bold backdrop-blur">🏆 {progress.trophies} {tr('trophies')}</span>
          <span className="rounded-full bg-white/20 px-4 py-2 font-fun font-bold backdrop-blur">🔥 {progress.streak} {tr('streak_days')}</span>
        </div>
      </motion.section>

      {/* Site interface language - prominent, accessible from the home page
          per the explicit requirement, independent from the "which language
          do you want to learn" picker further down this same page. */}
      <section className="mb-10 rounded-xl2 bg-white/70 p-5 text-center shadow-card card-outline">
        <p className="mb-3 font-fun font-extrabold text-ink/70">🌍 {tr('ui_lang_picker_title')}</p>
        <UiLanguageSelector />
      </section>

      {/* The two main site categories - large, unmissable tiles, per the
          explicit "כרטיס/אריח גדול וברור" requirement. Everything else on
          this page (quick-access icons, search, popular/new/recommended)
          is secondary to this pair. */}
      <section className="mb-10 grid gap-5 sm:grid-cols-2">
        <MotionLink
          to="/games"
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex flex-col items-center gap-2 rounded-blob bg-gradient-to-br from-candy-500 via-sunny-500 to-sunny-400 px-6 py-10 text-center text-white shadow-pop card-outline btn-pressable"
        >
          <span className="text-6xl">🎮</span>
          <span className="mt-2 font-fun text-2xl font-extrabold sm:text-3xl">{tr('cat_fun_games')}</span>
          <span className="text-white/90">{tr('cat_fun_tagline')}</span>
        </MotionLink>
        <MotionLink
          to="/games/learning"
          whileHover={{ y: -6, scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          className="flex flex-col items-center gap-2 rounded-blob bg-gradient-to-br from-sky-600 via-grape-600 to-ink px-6 py-10 text-center text-white shadow-pop card-outline btn-pressable"
        >
          <span className="text-6xl">📚</span>
          <span className="mt-2 font-fun text-2xl font-extrabold sm:text-3xl">{tr('cat_learning_games')}</span>
          <span className="text-white/90">{tr('cat_learning_tagline')}</span>
        </MotionLink>
      </section>

      <section className="mb-10 rounded-xl2 bg-white/70 p-5 shadow-card card-outline">
        <label htmlFor="game-search" className="mb-2 block text-center font-fun font-bold text-ink/60">
          🔎 {tr('search_games_label')}
        </label>
        <input
          id="game-search"
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={tr('search_games_placeholder')}
          className="mx-auto block w-full max-w-md rounded-full border-2 border-ink/10 bg-white px-5 py-2.5 text-center font-fun font-bold text-ink shadow-card outline-none focus:border-grape-400"
        />
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2" role="group" aria-label={tr('filter_by_category')}>
          {(
            [
              { id: 'all', label: tr('filter_all') },
              { id: 'fun', label: `🎮 ${tr('cat_fun_games')}` },
              { id: 'learning', label: `📚 ${tr('cat_learning_games')}` },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setSectionFilter(opt.id)}
              aria-pressed={sectionFilter === opt.id}
              className={`rounded-full px-4 py-1.5 font-fun text-sm font-extrabold shadow-card btn-pressable ${
                sectionFilter === opt.id ? 'bg-grape-500 text-white' : 'bg-white text-ink card-outline'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {isSearchActive && (
          <div className="mt-5">
            {searchResults.length > 0 ? (
              <GameGrid games={searchResults} hrefFor={hrefForGame} />
            ) : (
              <p className="text-center font-fun font-bold text-ink/40">{tr('no_games_found')}</p>
            )}
          </div>
        )}
      </section>

      <section className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {HOME_CARDS.map((card) => (
          <MotionLink
            key={card.key}
            to={card.to}
            whileHover={{ y: -4, scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className={`flex flex-col items-center gap-2 rounded-xl2 bg-gradient-to-br ${card.color} px-3 py-5 text-white shadow-pop card-outline btn-pressable`}
          >
            <span className="text-4xl">{card.icon}</span>
            <span className="text-center font-fun text-sm font-extrabold">{tr(card.key)}</span>
          </MotionLink>
        ))}
      </section>

      <section className="mb-10 rounded-xl2 bg-white/70 p-5 shadow-card card-outline">
        <p className="mb-3 text-center font-fun font-bold text-ink/60">{tr('choose_language')}</p>
        <LanguageSelector value={progress.selectedLanguage} onChange={setSelectedLanguage} />
      </section>

      <HomeSection title={tr('section_continue')}>
        {continueGame ? (
          <div className="max-w-[220px]">
            <GameCard game={continueGame} href={hrefForGame(continueGame)} />
          </div>
        ) : (
          <EmptyNote text={tr('empty_state_continue')} />
        )}
      </HomeSection>

      <HomeSection title={tr('section_popular')}>
        <GameGrid games={popularGames} hrefFor={hrefForGame} />
      </HomeSection>

      {newGames.length > 0 && (
        <HomeSection title={tr('section_new')}>
          <GameGrid games={newGames} hrefFor={hrefForGame} />
        </HomeSection>
      )}

      <HomeSection title={tr('section_recommended')}>
        <GameGrid games={recommended} hrefFor={hrefForGame} />
      </HomeSection>

      <section className="mt-4 rounded-xl2 bg-white/70 p-6 shadow-card card-outline">
        <h2 className="mb-2 font-fun text-lg font-extrabold text-ink">{tr('home_seo_fun_title')}</h2>
        <p className="mb-4 text-sm leading-relaxed text-ink/70">{tr('home_seo_fun_body')}</p>
        <h2 className="mb-2 font-fun text-lg font-extrabold text-ink">{tr('home_seo_lang_title')}</h2>
        <p className="text-sm leading-relaxed text-ink/70">{tr('home_seo_lang_body')}</p>
      </section>
    </div>
  )
}

function HomeSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 font-fun text-xl font-extrabold text-ink">{title}</h2>
      {children}
    </section>
  )
}

function EmptyNote({ text }: { text: string }) {
  return <div className="rounded-xl2 bg-white/70 px-5 py-6 text-center font-fun font-bold text-ink/40 shadow-card card-outline">{text}</div>
}
