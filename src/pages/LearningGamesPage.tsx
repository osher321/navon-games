import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import Breadcrumbs from '../components/Breadcrumbs'
import SEOHead from '../seo/SEOHead'
import { SITE_URL } from '../seo/config'
import { useI18n } from '../i18n/LanguageContext'

const MotionLink = motion(Link)

const SUB_CARDS = [
  { to: '/learn-languages', icon: '🌍', titleKey: 'cat_languages', descKey: 'learning_languages_card_desc', color: 'from-sky-600 via-grape-600 to-ink' },
  { to: '/games/learning/logic', icon: '🧠', titleKey: 'learning_logic_title', descKey: 'learning_logic_card_desc', color: 'from-candy-500 to-grape-500' },
  { to: '/games/learning/math', icon: '🧮', titleKey: 'learning_math_title', descKey: 'learning_math_card_desc', color: 'from-grass-500 to-sky-500' },
]

/** 📚 "משחקים בשביל ללמוד" - the learning hub, one card per sub-area. The
    🌍 לומדים שפות card links straight into the existing, untouched
    /learn-languages hub rather than reimplementing anything about it here. */
export default function LearningGamesPage() {
  const { tr } = useI18n()
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
      <Breadcrumbs items={[{ label: tr('nav_home'), href: '/' }, { label: tr('cat_learning_games') }]} />

      <h1 className="mb-2 text-center font-fun text-3xl font-extrabold text-grape-600">📚 {tr('cat_learning_games')}</h1>
      <p className="mb-8 text-center text-ink/50">{tr('cat_learning_tagline')}</p>

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
            <span className="font-fun text-xl font-extrabold">{tr(card.titleKey)}</span>
            <span className="text-sm text-white/85">{tr(card.descKey)}</span>
          </MotionLink>
        ))}
      </div>
    </div>
  )
}
