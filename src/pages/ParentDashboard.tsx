import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { useI18n } from '../i18n/LanguageContext'
import { useProgress } from '../hooks/useProgress'
import { LANG_META } from '../i18n/translations'
import FlagIcon from '../components/FlagIcon'
import { getGameById } from '../data/games'
import { vocabById } from '../data/vocabulary'
import { ACHIEVEMENTS } from '../data/achievements'
import type { LangCode } from '../types'
import ProgressBar from '../components/ProgressBar'
import Ltr from '../components/Ltr'

const LANGS: LangCode[] = ['he', 'en', 'ar', 'es']

export default function ParentDashboard() {
  const { tr, lang: uiLang } = useI18n()
  const { progress } = useProgress()

  const totalMinutes = useMemo(
    () => Math.round(progress.recentGames.reduce((sum, g) => sum + g.durationSec, 0) / 60),
    [progress.recentGames]
  )

  const gamesPlayedSummary = useMemo(() => {
    const map = new Map<string, number>()
    progress.recentGames.forEach((g) => map.set(g.gameId, (map.get(g.gameId) ?? 0) + 1))
    return Array.from(map.entries())
      .map(([gameId, count]) => ({ game: getGameById(gameId), count }))
      .filter((x) => x.game)
      .sort((a, b) => b.count - a.count)
  }, [progress.recentGames])

  const weakTopics = useMemo(() => {
    const entries: { id: string; count: number }[] = []
    LANGS.forEach((l) => {
      Object.entries(progress.languages[l].weakWords).forEach(([id, count]) => {
        if (count > 0) entries.push({ id, count })
      })
    })
    return entries
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)
      .map((e) => ({ ...e, vocab: vocabById(e.id) }))
      .filter((e) => e.vocab)
  }, [progress.languages])

  const activeLanguages = LANGS.filter((l) => progress.languages[l].gamesPlayed > 0)

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 pb-24">
      <h1 className="mb-2 text-center font-fun text-3xl font-extrabold text-grape-600">{tr('parent_title')}</h1>
      <p className="mb-8 text-center text-ink/50">{progress.profile.name || tr('child_name_default')}</p>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard icon="⏱️" label={tr('parent_time_played')} value={`${totalMinutes} ${tr('minutes')}`} color="bg-sky-100 text-sky-600" />
        <StatCard icon="🎮" label={tr('parent_games_played')} value={progress.gamesPlayedTotal} color="bg-candy-100 text-candy-600" />
        <StatCard icon="🔥" label={tr('parent_streak')} value={`${progress.streak} ${tr('streak_days')}`} color="bg-sunny-100 text-sunny-600" />
        <StatCard
          icon="🏆"
          label={tr('parent_achievements')}
          value={
            <Ltr>
              {progress.achievements.length}/{ACHIEVEMENTS.length}
            </Ltr>
          }
          color="bg-grass-100 text-grass-600"
        />
      </div>

      <section className="mt-10">
        <h2 className="mb-4 font-fun text-xl font-extrabold text-ink">{tr('parent_language_progress')}</h2>
        {activeLanguages.length === 0 ? (
          <EmptyNote text={tr('empty_state_recommend')} />
        ) : (
          <div className="space-y-3">
            {activeLanguages.map((l) => {
              const lp = progress.languages[l]
              return (
                <div key={l} className="rounded-xl2 bg-white p-4 shadow-card card-outline">
                  <div className="mb-2 flex items-center justify-between font-fun font-extrabold">
                    <span className="flex items-center gap-2">
                      <FlagIcon lang={l} size={24} /> {LANG_META[l].native}
                    </span>
                    <span className="text-xs text-ink/40">
                      {lp.wordsLearned.length} {tr('parent_words_learned')}
                    </span>
                  </div>
                  <ProgressBar value={lp.unlockedLevels.length} max={4} showLabel />
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-fun text-xl font-extrabold text-ink">{tr('parent_games_played')}</h2>
        {gamesPlayedSummary.length === 0 ? (
          <EmptyNote text={tr('empty_state_recommend')} />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {gamesPlayedSummary.map(({ game, count }) => (
              <div key={game!.id} className="flex items-center gap-2 rounded-xl2 bg-white p-3 shadow-card card-outline">
                <span className="text-2xl">{game!.icon}</span>
                <div>
                  <p className="font-fun text-sm font-extrabold text-ink">{tr(game!.nameKey)}</p>
                  <p className="text-xs font-bold text-ink/40">×{count}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-fun text-xl font-extrabold text-ink">{tr('parent_weak_topics')}</h2>
        {weakTopics.length === 0 ? (
          <EmptyNote text={tr('empty_state_recommend')} />
        ) : (
          <div className="flex flex-wrap gap-2">
            {weakTopics.map((t) => (
              <span key={t.id} className="rounded-full bg-candy-50 px-3 py-2 font-fun text-sm font-bold text-candy-600 shadow-card">
                {t.vocab!.emoji} {t.vocab!.text[uiLang] ?? t.vocab!.text.he}
              </span>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: ReactNode; color: string }) {
  return (
    <div className={`flex flex-col items-center gap-1 rounded-xl2 p-4 shadow-card card-outline ${color}`}>
      <span className="text-2xl">{icon}</span>
      <span className="font-fun text-lg font-extrabold">{value}</span>
      <span className="text-center text-xs font-bold opacity-80">{label}</span>
    </div>
  )
}

function EmptyNote({ text }: { text: string }) {
  return <div className="rounded-xl2 bg-white/70 px-5 py-6 text-center font-fun font-bold text-ink/40 shadow-card card-outline">{text}</div>
}
