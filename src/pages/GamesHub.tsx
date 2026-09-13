import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/LanguageContext'
import { FUN_GAMES } from '../data/games'
import GameGrid from '../components/GameGrid'

export default function GamesHub() {
  const { tr } = useI18n()
  const navigate = useNavigate()
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24">
      <h1 className="mb-2 text-center font-fun text-3xl font-extrabold text-grape-600">{tr('fun_games_title')}</h1>
      <p className="mb-8 text-center text-ink/50">{tr('home_hero_sub')}</p>

      <button
        onClick={() => navigate('/games/gtn')}
        className="group relative mb-8 w-full overflow-hidden rounded-blob bg-gradient-to-br from-ink via-grape-600 to-candy-600 p-6 text-white shadow-pop card-outline btn-pressable sm:p-8"
      >
        <span className="absolute -top-2 -right-2 rotate-6 rounded-full bg-sunny-400 px-2.5 py-1 text-[11px] font-extrabold text-ink shadow-card font-fun">
          ✨ {tr('badge_new')}
        </span>
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-start">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white/15 text-5xl transition-transform group-hover:scale-105">
              🎮
            </div>
            <div>
              <p className="font-fun text-xs font-bold uppercase tracking-widest text-white/60">{tr('gtn_flagship_label')}</p>
              <h2 className="font-fun text-2xl font-extrabold sm:text-3xl">GTN</h2>
              <p className="font-fun text-sm font-bold text-white/80">Grand Theft Neighborhood</p>
              <p className="mt-1 max-w-md text-sm text-white/70">{tr('gtn_desc')}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-white px-6 py-3 font-fun text-lg font-extrabold text-ink shadow-card">▶ PLAY</span>
        </div>
      </button>

      <button
        onClick={() => navigate('/games/vocab-academy')}
        className="group relative mb-8 w-full overflow-hidden rounded-blob bg-gradient-to-br from-sky-600 via-grape-600 to-ink p-6 text-white shadow-pop card-outline btn-pressable sm:p-8"
      >
        <span className="absolute -top-2 -right-2 rotate-6 rounded-full bg-sunny-400 px-2.5 py-1 text-[11px] font-extrabold text-ink shadow-card font-fun">
          ✨ {tr('badge_new')}
        </span>
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-start">
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="grid h-20 w-20 shrink-0 place-items-center rounded-2xl bg-white/15 text-5xl transition-transform group-hover:scale-105">
              🎓
            </div>
            <div>
              <h2 className="font-fun text-2xl font-extrabold sm:text-3xl">אוצר מילים באנגלית</h2>
              <p className="font-fun text-sm font-bold text-white/80">English Vocabulary Academy</p>
              <p className="mt-1 max-w-md text-sm text-white/70">תלמד אנגלית, תשחק ותעלה רמות</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-white px-6 py-3 font-fun text-lg font-extrabold text-ink shadow-card">▶ PLAY</span>
        </div>
      </button>

      <GameGrid games={FUN_GAMES} />
    </div>
  )
}
