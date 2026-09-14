import { Navigate, useParams } from 'react-router-dom'
import { learningGamesBySubcategory } from '../data/games'
import GameGrid from '../components/GameGrid'
import Breadcrumbs from '../components/Breadcrumbs'
import SEOHead from '../seo/SEOHead'
import { SITE_URL } from '../seo/config'

const COPY = {
  math: {
    title: 'משחקי חשבון לילדים - חיבור, חיסור, כפל וחילוק | נבון משחקים',
    description: 'משחקי חשבון לילדים לפי כיתות א׳-ג׳: חיבור, חיסור, כפל, חילוק, לוח הכפל, שברים, גיאומטריה, שעון וזמן, כסף וקניות ובעיות מילוליות.',
    h1: '🧮 חשבון',
    intro: 'תרגלו חשבון בצורה כיפית: חיבור, חיסור, כפל, חילוק, לוח הכפל, שברים, גיאומטריה, שעון וזמן, כסף וקניות, ומספרים - כל אחד עם רמות קושי לכיתה א׳, ב׳ ו-ג׳.',
    breadcrumbLabel: '🧮 חשבון',
  },
  logic: {
    title: 'משחקי חשיבה ולוגיקה לילדים | נבון משחקים',
    description: 'משחקי חשיבה ולוגיקה לילדים: סודוקו, רצפי מספרים, מה יוצא דופן וחידות היגיון מקוריות עם הסבר לאחר הפתרון.',
    h1: '🧠 חשיבה ולוגיקה',
    intro: 'תרגלו חשיבה לוגית עם סודוקו, רצפי מספרים, זיהוי הפריט השונה בקבוצה, וחידות היגיון מקוריות עם הסבר אחרי כל תשובה.',
    breadcrumbLabel: '🧠 חשיבה ולוגיקה',
  },
} as const

type SubKey = keyof typeof COPY

export default function LearningSubcategoryPage() {
  const { subcategory } = useParams<{ subcategory: string }>()
  const key = subcategory as SubKey

  if (key !== 'math' && key !== 'logic') return <Navigate to="/games/learning" replace />

  const copy = COPY[key]
  const games = learningGamesBySubcategory(key)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: copy.h1,
    description: copy.description,
    url: `${SITE_URL}/games/learning/${key}`,
    inLanguage: 'he',
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24">
      <SEOHead title={copy.title} description={copy.description} path={`/games/learning/${key}`} jsonLd={jsonLd} />
      <Breadcrumbs
        items={[
          { label: 'דף הבית', href: '/' },
          { label: 'משחקים בשביל ללמוד', href: '/games/learning' },
          { label: copy.breadcrumbLabel },
        ]}
      />

      <h1 className="mb-2 text-center font-fun text-3xl font-extrabold text-grape-600">{copy.h1}</h1>
      <p className="mx-auto mb-8 max-w-xl text-center text-sm text-ink/60">{copy.intro}</p>

      <GameGrid games={games} />
    </div>
  )
}
