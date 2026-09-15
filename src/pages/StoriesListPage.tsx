import { useParams } from 'react-router-dom'
import { getStoriesByLanguage } from '../vocab/data/stories'
import { useVocabProgress } from '../vocab/progress/useVocabProgress'
import StoriesListScreen from '../vocab/ui/stories/StoriesListScreen'
import Breadcrumbs from '../components/Breadcrumbs'
import SEOHead from '../seo/SEOHead'
import { SITE_URL } from '../seo/config'
import { SLUG_TO_LANG } from '../seo/languageSlugs'
import { useI18n } from '../i18n/LanguageContext'

// SEO title/description stay Hebrew-authored (this route is prerendered
// once per language slug, not per interface-language) - h1/intro/breadcrumb
// below react to the interface language via the *Key fields instead.
const SEO_COPY: Record<string, { title: string; description: string }> = {
  hebrew: {
    title: 'סיפורים בעברית לתרגול קריאה | נבון משחקים',
    description: '10 סיפורים מקוריים בעברית לתרגול קריאה והבנת הנקרא - לחצו על כל מילה כדי לשמוע הגייה וללמוד את משמעותה.',
  },
  english: {
    title: 'סיפורים באנגלית ללימוד אוצר מילים | נבון משחקים',
    description: '10 סיפורים קצרים ומקוריים באנגלית ללימוד אוצר מילים - לחצו על כל מילה כדי לשמוע הגייה וללמוד את התרגום לעברית.',
  },
  spanish: {
    title: 'סיפורים בספרדית ללימוד אוצר מילים | נבון משחקים',
    description: '10 סיפורים קצרים ומקוריים בספרדית ללימוד אוצר מילים - לחצו על כל מילה כדי לשמוע הגייה וללמוד את התרגום לעברית.',
  },
}

const UI_COPY: Record<string, { nameKey: string; introKey: string }> = {
  hebrew: { nameKey: 'game_stories_academy_he_name', introKey: 'stories_hebrew_intro' },
  english: { nameKey: 'game_stories_academy_name', introKey: 'stories_english_intro' },
  spanish: { nameKey: 'game_stories_academy_es_name', introKey: 'stories_spanish_intro' },
}

export default function StoriesListPage() {
  const { tr } = useI18n()
  const { langSlug = '' } = useParams()
  const language = SLUG_TO_LANG[langSlug]
  const seo = SEO_COPY[langSlug]
  const ui = UI_COPY[langSlug]
  const { progress } = useVocabProgress()

  if (!language || !seo || !ui) return null

  const h1 = `📖 ${tr(ui.nameKey)}`

  const stories = getStoriesByLanguage(language)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: h1,
    description: seo.description,
    url: `${SITE_URL}/learn-languages/stories/${langSlug}`,
    inLanguage: language,
    hasPart: stories.map((s) => ({
      '@type': 'CreativeWork',
      name: s.title,
      url: `${SITE_URL}/learn-languages/stories/${langSlug}/${s.id}`,
    })),
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-24">
      <SEOHead title={seo.title} description={seo.description} path={`/learn-languages/stories/${langSlug}`} jsonLd={jsonLd} />
      <Breadcrumbs
        items={[
          { label: tr('nav_home'), href: '/' },
          { label: tr('cat_learning_games'), href: '/games/learning' },
          { label: tr('cat_languages'), href: '/learn-languages' },
          { label: tr('cat_stories'), href: '/learn-languages/stories' },
          { label: tr(ui.nameKey) },
        ]}
      />

      <h1 className="mb-2 text-center font-fun text-2xl font-extrabold text-grape-600">{h1}</h1>
      <p className="mx-auto mb-6 max-w-xl text-center text-sm text-ink/60">{tr(ui.introKey)}</p>

      <StoriesListScreen
        stories={stories}
        readIds={progress.storiesRead}
        completedIds={progress.storiesCompleted}
        getStoryHref={(storyId) => `/learn-languages/stories/${langSlug}/${storyId}`}
        backHref="/learn-languages/stories"
      />
    </div>
  )
}
