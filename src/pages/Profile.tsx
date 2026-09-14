import { useState } from 'react'
import { useI18n } from '../i18n/LanguageContext'
import { useProgress } from '../hooks/useProgress'
import { LANG_META } from '../i18n/translations'
import FlagIcon from '../components/FlagIcon'
import { LEVELS } from '../types'
import type { LangCode } from '../types'
import { getGameById } from '../data/games'
import ProgressBar from '../components/ProgressBar'

// Arabic removed from the language-learning system - never listed/rendered here even if old stored progress still has an 'ar' entry.
const LANGS: LangCode[] = ['he', 'en', 'es']

export default function Profile() {
  const { tr } = useI18n()
  const { progress, updateProfile, avatars } = useProgress()
  const [name, setName] = useState(progress.profile.name)

  const playerLevel = Math.floor(progress.totalXP / 200) + 1
  const activeLanguages = LANGS.filter((l) => progress.languages[l].xp > 0)

  const records = Object.entries(progress.bestScores)
    .map(([gameId, score]) => ({ game: getGameById(gameId), score }))
    .filter((r) => r.game)
    .sort((a, b) => b.score - a.score)
    .slice(0, 6)

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 pb-24">
      <h1 className="mb-6 text-center font-fun text-3xl font-extrabold text-grape-600">{tr('profile_title')}</h1>

      <div className="rounded-blob bg-gradient-to-br from-grape-500 to-candy-500 p-6 text-center text-white shadow-pop">
        <div className="text-7xl">{progress.profile.avatar}</div>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            updateProfile({ name: e.target.value })
          }}
          placeholder={tr('child_name_default')}
          className="mt-3 w-full max-w-[240px] rounded-full bg-white/20 px-4 py-2 text-center font-fun text-lg font-extrabold text-white placeholder-white/70 outline-none backdrop-blur"
        />
        <p className="mt-2 font-fun font-bold">
          {tr('profile_level')} {playerLevel}
        </p>
      </div>

      <div className="mt-4">
        <p className="mb-2 text-center text-sm font-bold text-ink/50">{tr('select_avatar')}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {avatars.map((a) => (
            <button
              key={a}
              onClick={() => updateProfile({ avatar: a })}
              className={`grid h-12 w-12 place-items-center rounded-full text-2xl shadow-card card-outline btn-pressable ${
                progress.profile.avatar === a ? 'bg-sunny-300' : 'bg-white'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon="⭐" label={tr('xp')} value={progress.totalXP} color="bg-sunny-100 text-sunny-600" />
        <StatCard icon="🎮" label={tr('profile_games_played')} value={progress.gamesPlayedTotal} color="bg-candy-100 text-candy-600" />
        <StatCard icon="🔥" label={tr('profile_streak')} value={progress.streak} color="bg-grape-100 text-grape-600" />
        <StatCard icon="🏆" label={tr('trophies')} value={progress.trophies} color="bg-grass-100 text-grass-600" />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 font-fun text-xl font-extrabold text-ink">{tr('profile_languages_learned')}</h2>
        {activeLanguages.length === 0 ? (
          <div className="rounded-xl2 bg-white/70 px-5 py-6 text-center font-fun font-bold text-ink/40 shadow-card card-outline">
            {tr('empty_state_recommend')}
          </div>
        ) : (
          <div className="space-y-4">
            {activeLanguages.map((l) => {
              const lp = progress.languages[l]
              const idx = lp.unlockedLevels.length - 1
              const current = LEVELS[idx]
              const next = LEVELS[idx + 1]
              const span = next ? next.xpRequired - current.xpRequired : 1
              const done = lp.xp - current.xpRequired
              return (
                <div key={l} className="rounded-xl2 bg-white p-4 shadow-card card-outline">
                  <div className="mb-2 flex items-center justify-between font-fun font-extrabold">
                    <span className="flex items-center gap-2">
                      <FlagIcon lang={l} size={24} /> {LANG_META[l].label}
                    </span>
                    <span className="text-xs text-ink/40">{tr(`level_${current.id}`)}</span>
                  </div>
                  <ProgressBar value={done} max={Math.max(1, span)} showLabel />
                  <p className="mt-1 text-xs text-ink/40">
                    {lp.wordsLearned.length} {tr('words')} · {lp.gamesPlayed} {tr('games')}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-fun text-xl font-extrabold text-ink">{tr('my_records')}</h2>
        {records.length === 0 ? (
          <div className="rounded-xl2 bg-white/70 px-5 py-6 text-center font-fun font-bold text-ink/40 shadow-card card-outline">
            {tr('empty_state_recommend')}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {records.map(({ game, score }) => (
              <div key={game!.id} className="flex items-center gap-2 rounded-xl2 bg-white p-3 shadow-card card-outline">
                <span className="text-2xl">{game!.icon}</span>
                <div>
                  <p className="font-fun text-sm font-extrabold text-ink">{tr(game!.nameKey)}</p>
                  <p className="text-xs font-bold text-sunny-600">🏅 {score}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: number; color: string }) {
  return (
    <div className={`flex flex-col items-center gap-1 rounded-xl2 p-4 shadow-card card-outline ${color}`}>
      <span className="text-2xl">{icon}</span>
      <span className="font-fun text-xl font-extrabold">{value}</span>
      <span className="text-center text-xs font-bold opacity-80">{label}</span>
    </div>
  )
}
