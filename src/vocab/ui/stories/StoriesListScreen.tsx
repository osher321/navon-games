import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { LangCode } from '../../../types'
import type { AgeRange, Story, StoryGenre, StoryLevel } from '../../data/stories/types'
import { AGE_RANGES, STORY_GENRES, STORY_LEVELS, getGenreDef, getStoryLevelDef } from '../../data/stories/types'
import { useI18n } from '../../../i18n/LanguageContext'
import FlagIcon from '../../../components/FlagIcon'

const MotionLink = motion(Link)

interface LanguageSwitcherItem {
  slug: string
  lang: LangCode
  nameKey: string
  href: string
  active: boolean
}

interface StoriesListScreenProps {
  stories: Story[]
  readIds: string[]
  completedIds: string[]
  /** Builds the real route for a story (not just a click handler) - Google's
      crawler discovers internal links from `<a href>`, not from onClick JS. */
  getStoryHref: (storyId: string) => string
  backHref: string
  /** The 3 story-language "tabs" for this library (Hebrew/English/Spanish) so
      readers can jump between them without leaving the page. */
  languageSwitcher: LanguageSwitcherItem[]
  /** Cross-link to that language's games hub, shown after the story grid. */
  gamesHref: string
}

/** Rough reading-time estimate from the story's own line content (~130
    words/min, a comfortable pace for language learners) - no invented data,
    just a derived, low-risk convenience figure. */
function estimateReadMinutes(story: Story): number {
  const words = story.lines.join(' ').trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.round(words / 130))
}

function StoryCard({ story, isCompleted, isRead, getStoryHref, tr }: { story: Story; isCompleted: boolean; isRead: boolean; getStoryHref: (id: string) => string; tr: (k: string) => string }) {
  const levelDef = getStoryLevelDef(story.level)
  const readMinutes = estimateReadMinutes(story)
  return (
    <motion.div whileTap={{ scale: 0.98 }} className="flex flex-col overflow-hidden rounded-xl2 bg-white shadow-card card-outline">
      <img src={story.image} alt={story.imageAlt} loading="lazy" width={800} height={500} className="aspect-[8/5] w-full object-cover" />
      <div className="flex flex-1 flex-col p-4">
        <p className="font-fun text-base font-extrabold text-ink">📖 {story.title}</p>
        <p className="mt-1 text-xs text-ink/50">{story.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-bold text-ink/60">
          <span>
            {levelDef.icon} {levelDef.labelHe}
          </span>
          <span>·</span>
          <span>🎂 {story.ageRange.join(', ')}</span>
          <span>·</span>
          <span>⏱️ ~{readMinutes} {tr('story_min_read_suffix')}</span>
        </div>
        <div className="mt-2 flex flex-wrap gap-1.5 text-xs font-bold">
          {story.genres.map((g) => {
            const def = getGenreDef(g)
            return (
              <span key={g} className="rounded-full bg-grape-50 px-2 py-0.5 text-grape-700">
                {def.icon} {def.labelHe}
              </span>
            )
          })}
          {isCompleted && <span className="rounded-full bg-grass-100 px-2 py-0.5 text-grass-700">✅ {tr('stories_completed_badge')}</span>}
          {!isCompleted && isRead && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-700">👀 {tr('stories_read_badge')}</span>}
        </div>
        <MotionLink
          to={getStoryHref(story.id)}
          whileTap={{ scale: 0.97 }}
          className="mt-4 block w-full rounded-full bg-grape-500 px-5 py-2.5 text-center font-fun text-sm font-extrabold text-white shadow-card btn-pressable"
        >
          {isRead ? `📖 ${tr('stories_continue_reading')}` : `▶ ${tr('stories_start_reading')}`}
        </MotionLink>
      </div>
    </motion.div>
  )
}

export default function StoriesListScreen({
  stories,
  readIds,
  completedIds,
  getStoryHref,
  backHref,
  languageSwitcher,
  gamesHref,
}: StoriesListScreenProps) {
  const { tr } = useI18n()
  const [ageFilter, setAgeFilter] = useState<AgeRange | 'all'>('all')
  const [levelFilter, setLevelFilter] = useState<StoryLevel | 'all'>('all')
  const [genreFilter, setGenreFilter] = useState<StoryGenre | 'all'>('all')
  const [query, setQuery] = useState('')

  const filteredStories = useMemo(() => {
    const q = query.trim().toLowerCase()
    return stories.filter((story) => {
      if (levelFilter !== 'all' && story.level !== levelFilter) return false
      if (ageFilter !== 'all' && !story.ageRange.includes(ageFilter)) return false
      if (genreFilter !== 'all' && !story.genres.includes(genreFilter)) return false
      if (q && !story.title.toLowerCase().includes(q)) return false
      return true
    })
  }, [stories, levelFilter, ageFilter, genreFilter, query])

  // Grouped by level whenever no single level is chosen, so the library
  // reads as 5 clear shelves instead of one long undifferentiated list.
  const groupedByLevel = useMemo(() => {
    if (levelFilter !== 'all') return null
    return STORY_LEVELS.map((lvl) => ({ level: lvl, stories: filteredStories.filter((s) => s.level === lvl.id) })).filter((g) => g.stories.length > 0)
  }, [filteredStories, levelFilter])

  const renderCard = (story: Story) => (
    <StoryCard key={story.id} story={story} isCompleted={completedIds.includes(story.id)} isRead={readIds.includes(story.id)} getStoryHref={getStoryHref} tr={tr} />
  )

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-2">
        <Link
          to={backHref}
          aria-label={tr('cat_languages')}
          className="shrink-0 rounded-full bg-white px-4 py-2 font-fun text-sm font-extrabold text-ink shadow-card card-outline btn-pressable"
        >
          ⬅ {tr('common_back')}
        </Link>
        <div className="w-16 shrink-0" aria-hidden="true" />
      </div>

      {/* --- Section: language switcher --- */}
      <section className="mb-8 rounded-xl2 bg-white/70 p-4 shadow-card card-outline sm:p-5">
        <div className="flex flex-wrap justify-center gap-3" role="group" aria-label={tr('cat_languages')}>
          {languageSwitcher.map((item) => (
            <Link
              key={item.slug}
              to={item.href}
              aria-current={item.active ? 'page' : undefined}
              className={`flex min-w-[110px] flex-col items-center gap-1.5 rounded-xl2 px-4 py-2.5 font-fun text-sm font-extrabold shadow-card card-outline btn-pressable transition-all ${
                item.active ? 'scale-105 bg-grape-500 text-white' : 'bg-white text-ink hover:-translate-y-0.5'
              }`}
            >
              <FlagIcon lang={item.lang} size={28} />
              <span>{tr(item.nameKey)}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* --- Section: age selection (prominent, per the explicit request) --- */}
      <section className="mb-8 rounded-xl2 bg-white/70 p-4 shadow-card card-outline sm:p-5">
        <p className="mb-3 text-center font-fun font-bold text-ink/70">🎂 {tr('stories_age_prompt')}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setAgeFilter('all')}
            aria-pressed={ageFilter === 'all'}
            className={`rounded-full px-4 py-1.5 font-fun text-sm font-extrabold shadow-card btn-pressable ${
              ageFilter === 'all' ? 'bg-grape-500 text-white' : 'bg-white text-ink card-outline'
            }`}
          >
            {tr('filter_all')}
          </button>
          {AGE_RANGES.map((a) => (
            <button
              key={a.id}
              onClick={() => setAgeFilter(a.id)}
              aria-pressed={ageFilter === a.id}
              className={`rounded-full px-4 py-1.5 font-fun text-sm font-extrabold shadow-card btn-pressable ${
                ageFilter === a.id ? 'bg-grape-500 text-white' : 'bg-white text-ink card-outline'
              }`}
            >
              {a.icon} {a.id}
            </button>
          ))}
        </div>
        {ageFilter !== 'all' && <p className="mt-3 text-center text-xs font-bold text-ink/50">📖 {tr('stories_recommended_for_age')}</p>}
      </section>

      {/* --- Section: level filter --- */}
      <section className="mb-8">
        <p className="mb-3 text-center text-sm font-bold text-ink/50">{tr('stories_filter_by_level')}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setLevelFilter('all')}
            aria-pressed={levelFilter === 'all'}
            className={`rounded-full px-4 py-1.5 font-fun text-sm font-extrabold shadow-card btn-pressable ${
              levelFilter === 'all' ? 'bg-grape-500 text-white' : 'bg-white text-ink card-outline'
            }`}
          >
            {tr('filter_all')}
          </button>
          {STORY_LEVELS.map((lvl) => (
            <button
              key={lvl.id}
              onClick={() => setLevelFilter(lvl.id)}
              aria-pressed={levelFilter === lvl.id}
              className={`rounded-full px-4 py-1.5 font-fun text-sm font-extrabold shadow-card btn-pressable ${
                levelFilter === lvl.id ? 'bg-grape-500 text-white' : 'bg-white text-ink card-outline'
              }`}
            >
              {lvl.icon} {lvl.labelHe}
            </button>
          ))}
        </div>
      </section>

      {/* --- Section: genre filter --- */}
      <section className="mb-8">
        <p className="mb-3 text-center text-sm font-bold text-ink/50">🏷️ {tr('stories_filter_by_genre')}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            onClick={() => setGenreFilter('all')}
            aria-pressed={genreFilter === 'all'}
            className={`rounded-full px-3 py-1.5 font-fun text-xs font-extrabold shadow-card btn-pressable ${
              genreFilter === 'all' ? 'bg-grape-500 text-white' : 'bg-white text-ink card-outline'
            }`}
          >
            {tr('filter_all')}
          </button>
          {STORY_GENRES.map((g) => (
            <button
              key={g.id}
              onClick={() => setGenreFilter(g.id)}
              aria-pressed={genreFilter === g.id}
              className={`rounded-full px-3 py-1.5 font-fun text-xs font-extrabold shadow-card btn-pressable ${
                genreFilter === g.id ? 'bg-grape-500 text-white' : 'bg-white text-ink card-outline'
              }`}
            >
              {g.icon} {g.labelHe}
            </button>
          ))}
        </div>
      </section>

      {/* --- Section: search --- */}
      <section className="mb-10">
        <label htmlFor="story-search" className="mb-2 block text-center text-sm font-bold text-ink/50">
          🔎 {tr('stories_search_label')}
        </label>
        <input
          id="story-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={tr('stories_search_placeholder')}
          className="mx-auto block w-full max-w-md rounded-full border-2 border-ink/10 bg-white px-5 py-2.5 text-center font-fun font-bold text-ink shadow-card outline-none focus:border-grape-400"
        />
      </section>

      {/* --- Section: the stories, grouped by level (or flat when one level is chosen) --- */}
      <section>
        <h2 className="mb-1 text-center font-fun text-xl font-extrabold text-grape-600">📚 {tr('cat_stories')}</h2>
        <p className="mb-5 text-center text-xs font-bold text-ink/50">{tr('stories_pick_one')}</p>

        {filteredStories.length === 0 ? (
          <p className="rounded-xl2 bg-white/70 px-5 py-8 text-center font-fun font-bold text-ink/40 shadow-card card-outline">{tr('stories_no_results')}</p>
        ) : groupedByLevel ? (
          <div className="space-y-8">
            {groupedByLevel.map((group) => (
              <div key={group.level.id}>
                <h3 className="mb-3 font-fun text-base font-extrabold text-ink/70">
                  {group.level.icon} {group.level.labelHe}
                </h3>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">{group.stories.map(renderCard)}</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">{filteredStories.map(renderCard)}</div>
        )}
      </section>

      {/* --- Cross-link to that language's games --- */}
      <div className="mt-10 text-center">
        <Link to={gamesHref} className="inline-block rounded-full bg-white px-5 py-2.5 font-fun text-sm font-extrabold text-grape-600 shadow-card card-outline btn-pressable">
          🎮 {tr('stories_try_games_cta')}
        </Link>
      </div>
    </div>
  )
}
