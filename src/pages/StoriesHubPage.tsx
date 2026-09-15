import { STORY_GAMES } from '../data/games'
import GameGrid from '../components/GameGrid'
import Breadcrumbs from '../components/Breadcrumbs'
import SEOHead from '../seo/SEOHead'
import { SITE_URL } from '../seo/config'
import { useI18n } from '../i18n/LanguageContext'

const HREF_FOR_STORY_GAME: Record<string, string> = {
  stories_academy_he: '/learn-languages/stories/hebrew',
  stories_academy: '/learn-languages/stories/english',
  stories_academy_es: '/learn-languages/stories/spanish',
}

export default function StoriesHubPage() {
  const { tr } = useI18n()
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'סיפורים אינטראקטיביים בעברית, אנגלית וספרדית',
    description: 'אוסף של 30 סיפורים קצרים ואינטראקטיביים בשלוש שפות, עם מילים לחיצות והשמעה קולית.',
    url: `${SITE_URL}/learn-languages/stories`,
    inLanguage: 'he',
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-24">
      <SEOHead
        title="סיפורים בעברית, באנגלית ובספרדית | נבון משחקים"
        description="קראו סיפורים קצרים ואינטראקטיביים בעברית, באנגלית ובספרדית. לחצו על כל מילה כדי לשמוע הגייה וללמוד את משמעותה - 30 סיפורים מקוריים בשלוש שפות, לכל הרמות."
        path="/learn-languages/stories"
        jsonLd={jsonLd}
      />
      <Breadcrumbs
        items={[
          { label: tr('nav_home'), href: '/' },
          { label: tr('cat_learning_games'), href: '/games/learning' },
          { label: tr('cat_languages'), href: '/learn-languages' },
          { label: tr('cat_stories') },
        ]}
      />

      <h1 className="mb-2 text-center font-fun text-2xl font-extrabold text-grape-600">📖 {tr('stories_hub_title')}</h1>
      <p className="mx-auto mb-6 max-w-xl text-center text-ink/60">{tr('stories_hub_intro')}</p>

      <GameGrid games={STORY_GAMES} hrefFor={(g) => HREF_FOR_STORY_GAME[g.id] ?? '/learn-languages/stories'} />
    </div>
  )
}
