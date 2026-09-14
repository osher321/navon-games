import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useI18n } from '../i18n/LanguageContext'
import { funGames } from '../data/games'
import GameGrid from '../components/GameGrid'
import Breadcrumbs from '../components/Breadcrumbs'
import SEOHead from '../seo/SEOHead'
import { SITE_URL } from '../seo/config'

const MotionLink = motion(Link)

/** The 🎮 "משחקים בשביל הכיף" page - same /games URL the site has always
    used, now filtered to `section === 'fun'` games specifically instead of
    everything that happened to live in the FUN_GAMES array (which, after
    the math/logic learning games were added there for routing reasons,
    stopped being purely "fun" games). */
export default function GamesHub() {
  const { tr } = useI18n()
  const games = funGames()

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'משחקים בשביל הכיף',
    description: 'משחקי בידור וכיף לילדים ולכל המשפחה: זיכרון, קליעה למטרה, בלונים, מבוך, מרוץ לחלל, 2048 ועולם התלת-ממד GTN.',
    url: `${SITE_URL}/games`,
    inLanguage: 'he',
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24">
      <SEOHead
        title="משחקים בשביל הכיף | נבון משחקים"
        description="משחקי כיף ובידור לילדים ולכל המשפחה, בחינם וישירות בדפדפן: זיכרון, קליעה למטרה, בלונים, מבוך, מרוץ לחלל, 2048, ועולם התלת-ממד הפתוח GTN."
        path="/games"
        jsonLd={jsonLd}
      />
      <Breadcrumbs items={[{ label: 'דף הבית', href: '/' }, { label: 'משחקים בשביל הכיף' }]} />

      <h1 className="mb-2 text-center font-fun text-3xl font-extrabold text-grape-600">🎮 משחקים בשביל הכיף</h1>
      <p className="mb-8 text-center text-ink/50">כאן משחקים, נהנים ומאתגרים את עצמנו</p>

      <MotionLink
        to="/games/gtn"
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.99 }}
        className="group relative mb-8 block w-full overflow-hidden rounded-blob bg-gradient-to-br from-ink via-grape-600 to-candy-600 p-6 text-white shadow-pop card-outline btn-pressable sm:p-8"
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
      </MotionLink>

      <GameGrid games={games} />

      <p className="mx-auto mt-8 max-w-2xl text-center text-sm text-ink/50">
        מחפשים משחקים לימודיים? בקרו ב-
        <Link to="/games/learning" className="underline decoration-dotted hover:text-ink">
          📚 משחקים בשביל ללמוד
        </Link>
        .
      </p>
    </div>
  )
}
