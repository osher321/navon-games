import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useI18n } from '../i18n/LanguageContext'
import { useProgress } from '../hooks/useProgress'
import { ALL_GAMES, getGameById, isGameAvailableForLang } from '../data/games'
import GameCard from '../components/GameCard'
import GameGrid from '../components/GameGrid'
import LanguageSelector from '../components/LanguageSelector'

interface HomeCardDef {
  key: string
  icon: string
  color: string
  to: string
}

const HOME_CARDS: HomeCardDef[] = [
  { key: 'card_games', icon: '🎮', color: 'from-candy-400 to-candy-500', to: '/games' },
  { key: 'card_languages', icon: '📚', color: 'from-sky-400 to-sky-500', to: '/languages' },
  { key: 'card_achievements', icon: '🏆', color: 'from-sunny-400 to-sunny-500', to: '/achievements' },
  { key: 'card_points', icon: '⭐', color: 'from-grass-400 to-grass-500', to: '/profile' },
  { key: 'card_streak', icon: '🔥', color: 'from-grape-400 to-grape-500', to: '/profile' },
  { key: 'card_profile', icon: '👦', color: 'from-candy-400 to-grape-400', to: '/profile' },
]

export default function Home() {
  const { tr } = useI18n()
  const { progress, setSelectedLanguage } = useProgress()
  const navigate = useNavigate()

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

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-24">
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

      <section className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {HOME_CARDS.map((card) => (
          <motion.button
            key={card.key}
            whileHover={{ y: -4, scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate(card.to)}
            className={`flex flex-col items-center gap-2 rounded-xl2 bg-gradient-to-br ${card.color} px-3 py-5 text-white shadow-pop card-outline btn-pressable`}
          >
            <span className="text-4xl">{card.icon}</span>
            <span className="text-center font-fun text-sm font-extrabold">{tr(card.key)}</span>
          </motion.button>
        ))}
      </section>

      <section className="mb-10 rounded-xl2 bg-white/70 p-5 shadow-card card-outline">
        <p className="mb-3 text-center font-fun font-bold text-ink/60">{tr('choose_language')}</p>
        <LanguageSelector value={progress.selectedLanguage} onChange={setSelectedLanguage} />
      </section>

      <HomeSection title={tr('section_continue')}>
        {continueGame ? (
          <div className="max-w-[220px]">
            <GameCard game={continueGame} />
          </div>
        ) : (
          <EmptyNote text={tr('empty_state_continue')} />
        )}
      </HomeSection>

      <HomeSection title={tr('section_popular')}>
        <GameGrid games={popularGames} />
      </HomeSection>

      {newGames.length > 0 && (
        <HomeSection title={tr('section_new')}>
          <GameGrid games={newGames} />
        </HomeSection>
      )}

      <HomeSection title={tr('section_recommended')}>
        <GameGrid games={recommended} />
      </HomeSection>
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
