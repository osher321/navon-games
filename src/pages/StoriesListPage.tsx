import { useParams } from 'react-router-dom'
import { getStoriesByLanguage } from '../vocab/data/stories'
import { useVocabProgress } from '../vocab/progress/useVocabProgress'
import StoriesListScreen from '../vocab/ui/stories/StoriesListScreen'
import Breadcrumbs from '../components/Breadcrumbs'
import SEOHead from '../seo/SEOHead'
import { SITE_URL } from '../seo/config'
import { SLUG_TO_LANG, LANG_LABEL_HE } from '../seo/languageSlugs'

const PAGE_COPY: Record<string, { title: string; description: string; h1: string; intro: string }> = {
  hebrew: {
    title: 'סיפורים בעברית לתרגול קריאה | נבון משחקים',
    description: '10 סיפורים מקוריים בעברית לתרגול קריאה והבנת הנקרא - לחצו על כל מילה כדי לשמוע הגייה וללמוד את משמעותה.',
    h1: '📖 סיפורים בעברית',
    intro: 'עשרה סיפורים קצרים ומקוריים בעברית, מתאימים לתרגול קריאה והבנת הנקרא. בכל סיפור אפשר ללחוץ על כל מילה כדי לשמוע אותה ולראות הסבר קצר על משמעותה.',
  },
  english: {
    title: 'סיפורים באנגלית ללימוד אוצר מילים | נבון משחקים',
    description: '10 סיפורים קצרים ומקוריים באנגלית ללימוד אוצר מילים - לחצו על כל מילה כדי לשמוע הגייה וללמוד את התרגום לעברית.',
    h1: '📖 סיפורים באנגלית',
    intro: 'עשרה סיפורים קצרים ומקוריים באנגלית ברמות שונות, מצוינים לתרגול קריאה ולהרחבת אוצר המילים. לחצו על כל מילה באנגלית כדי לשמוע הגייה וללמוד את התרגום לעברית.',
  },
  spanish: {
    title: 'סיפורים בספרדית ללימוד אוצר מילים | נבון משחקים',
    description: '10 סיפורים קצרים ומקוריים בספרדית ללימוד אוצר מילים - לחצו על כל מילה כדי לשמוע הגייה וללמוד את התרגום לעברית.',
    h1: '📖 סיפורים בספרדית',
    intro: 'עשרה סיפורים קצרים ומקוריים בספרדית ברמות שונות, מצוינים לתרגול קריאה ולהרחבת אוצר המילים. לחצו על כל מילה בספרדית כדי לשמוע הגייה וללמוד את התרגום לעברית.',
  },
}

export default function StoriesListPage() {
  const { langSlug = '' } = useParams()
  const language = SLUG_TO_LANG[langSlug]
  const copy = PAGE_COPY[langSlug]
  const { progress } = useVocabProgress()

  if (!language || !copy) return null

  const stories = getStoriesByLanguage(language)

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: copy.h1,
    description: copy.description,
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
      <SEOHead title={copy.title} description={copy.description} path={`/learn-languages/stories/${langSlug}`} jsonLd={jsonLd} />
      <Breadcrumbs
        items={[
          { label: 'דף הבית', href: '/' },
          { label: 'משחקים בשביל ללמוד', href: '/games/learning' },
          { label: 'לומדים שפות', href: '/learn-languages' },
          { label: 'סיפורים', href: '/learn-languages/stories' },
          { label: LANG_LABEL_HE[language] },
        ]}
      />

      <h1 className="mb-2 text-center font-fun text-2xl font-extrabold text-grape-600">{copy.h1}</h1>
      <p className="mx-auto mb-6 max-w-xl text-center text-sm text-ink/60">{copy.intro}</p>

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
