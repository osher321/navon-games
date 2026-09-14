import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Breadcrumbs from '../components/Breadcrumbs'
import SEOHead from '../seo/SEOHead'
import { SITE_URL } from '../seo/config'

const MotionLink = motion(Link)

const SUB_CARDS = [
  {
    to: '/games/learning/math',
    icon: '🧮',
    title: 'חשבון',
    desc: 'חיבור, חיסור, כפל, חילוק, שברים, גיאומטריה, שעון, כסף ובעיות מילוליות',
    color: 'from-grass-500 to-sky-500',
  },
  {
    to: '/games/learning/logic',
    icon: '🧠',
    title: 'חשיבה ולוגיקה',
    desc: 'סודוקו, רצפים, מה יוצא דופן וחידות היגיון מקוריות',
    color: 'from-candy-500 to-grape-500',
  },
  {
    to: '/learn-languages',
    icon: '🌍',
    title: 'לומדים שפות',
    desc: 'עברית, אנגלית וספרדית - משחקים, אוצר מילים וסיפורים אינטראקטיביים',
    color: 'from-sky-600 via-grape-600 to-ink',
  },
]

/** 📚 "משחקים בשביל ללמוד" - the learning hub, one card per sub-area. The
    🌍 לומדים שפות card links straight into the existing, untouched
    /learn-languages hub rather than reimplementing anything about it here. */
export default function LearningGamesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'משחקים בשביל ללמוד',
    description: 'משחקים לימודיים לילדים: חשבון, חשיבה ולוגיקה, ולימוד שפות - עברית, אנגלית וספרדית.',
    url: `${SITE_URL}/games/learning`,
    inLanguage: 'he',
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 pb-24">
      <SEOHead
        title="משחקים בשביל ללמוד | משחקים לימודיים | נבון משחקים"
        description="משחקים לימודיים לילדים בחינם ובדפדפן: תרגול חשבון (חיבור, חיסור, כפל, חילוק, שברים ועוד), משחקי חשיבה ולוגיקה, ולימוד שפות - עברית, אנגלית וספרדית."
        path="/games/learning"
        jsonLd={jsonLd}
      />
      <Breadcrumbs items={[{ label: 'דף הבית', href: '/' }, { label: 'משחקים בשביל ללמוד' }]} />

      <h1 className="mb-2 text-center font-fun text-3xl font-extrabold text-grape-600">📚 משחקים בשביל ללמוד</h1>
      <p className="mb-8 text-center text-ink/50">כאן לומדים דרך משחקים</p>

      <div className="grid gap-5 sm:grid-cols-3">
        {SUB_CARDS.map((card) => (
          <MotionLink
            key={card.to}
            to={card.to}
            whileHover={{ y: -6, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            className={`flex flex-col items-center gap-3 rounded-xl2 bg-gradient-to-br ${card.color} p-6 text-center text-white shadow-pop card-outline btn-pressable`}
          >
            <span className="text-5xl">{card.icon}</span>
            <span className="font-fun text-xl font-extrabold">{card.title}</span>
            <span className="text-sm text-white/85">{card.desc}</span>
          </MotionLink>
        ))}
      </div>
    </div>
  )
}
