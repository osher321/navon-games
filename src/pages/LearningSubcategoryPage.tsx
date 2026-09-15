import { Navigate, useParams } from 'react-router-dom'
import { learningGamesBySubcategory } from '../data/games'
import GameGrid from '../components/GameGrid'
import Breadcrumbs from '../components/Breadcrumbs'
import SEOHead from '../seo/SEOHead'
import { SITE_URL } from '../seo/config'
import { useI18n } from '../i18n/LanguageContext'

// SEO title/description are authored once in Hebrew (matching how this
// route is actually indexed/prerendered) and deliberately stay fixed
// regardless of the visitor's chosen interface language - see the visible
// h1/intro below for the part that DOES react to it.
const SEO_COPY = {
  math: {
    title: 'משחקי חשבון לילדים - חיבור, חיסור, כפל וחילוק | נבון משחקים',
    description: 'משחקי חשבון לילדים לפי כיתות א׳-ג׳: חיבור, חיסור, כפל, חילוק, לוח הכפל, שברים, גיאומטריה, שעון וזמן, כסף וקניות ובעיות מילוליות.',
  },
  logic: {
    title: 'משחקי חשיבה ולוגיקה לילדים | נבון משחקים',
    description: 'משחקי חשיבה ולוגיקה לילדים: סודוקו, רצפי מספרים, מה יוצא דופן וחידות היגיון מקוריות עם הסבר לאחר הפתרון.',
  },
} as const

const UI_COPY = {
  math: { icon: '🧮', h1Key: 'learning_math_title', introKey: 'learning_math_intro' },
  logic: { icon: '🧠', h1Key: 'learning_logic_title', introKey: 'learning_logic_intro' },
} as const

type SubKey = keyof typeof SEO_COPY

export default function LearningSubcategoryPage() {
  const { tr } = useI18n()
  const { subcategory } = useParams<{ subcategory: string }>()
  const key = subcategory as SubKey

  if (key !== 'math' && key !== 'logic') return <Navigate to="/games/learning" replace />

  const seo = SEO_COPY[key]
  const ui = UI_COPY[key]
  const h1 = `${ui.icon} ${tr(ui.h1Key)}`
  const games = learningGamesBySubcategory(key)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: h1,
    description: seo.description,
    url: `${SITE_URL}/games/learning/${key}`,
    inLanguage: 'he',
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24">
      <SEOHead title={seo.title} description={seo.description} path={`/games/learning/${key}`} jsonLd={jsonLd} />
      <Breadcrumbs
        items={[
          { label: tr('nav_home'), href: '/' },
          { label: tr('cat_learning_games'), href: '/games/learning' },
          { label: h1 },
        ]}
      />

      <h1 className="mb-2 text-center font-fun text-3xl font-extrabold text-grape-600">{h1}</h1>
      <p className="mx-auto mb-8 max-w-xl text-center text-sm text-ink/60">{tr(ui.introKey)}</p>

      <GameGrid games={games} />
    </div>
  )
}
