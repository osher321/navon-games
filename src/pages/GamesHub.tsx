import { useI18n } from '../i18n/LanguageContext'
import { FUN_GAMES } from '../data/games'
import GameGrid from '../components/GameGrid'

export default function GamesHub() {
  const { tr } = useI18n()
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24">
      <h1 className="mb-2 text-center font-fun text-3xl font-extrabold text-grape-600">{tr('fun_games_title')}</h1>
      <p className="mb-8 text-center text-ink/50">{tr('home_hero_sub')}</p>
      <GameGrid games={FUN_GAMES} />
    </div>
  )
}
