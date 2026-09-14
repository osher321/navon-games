import { Navigate, useParams } from 'react-router-dom'
import { getStoryById, getStoriesByLanguage } from '../vocab/data/stories'
import { getStoryLevelDef } from '../vocab/data/stories/types'
import { useVocabProgress } from '../vocab/progress/useVocabProgress'
import StoryReaderScreen from '../vocab/ui/stories/StoryReaderScreen'
import Breadcrumbs from '../components/Breadcrumbs'
import SEOHead from '../seo/SEOHead'
import { SITE_URL } from '../seo/config'
import { SLUG_TO_LANG, LANG_LABEL_HE } from '../seo/languageSlugs'

export default function StoryReaderPage() {
  const { langSlug = '', storyId = '' } = useParams()
  const language = SLUG_TO_LANG[langSlug]
  const story = getStoryById(storyId)
  const { progress, markStoryRead, markStoryCompleted } = useVocabProgress()

  // Wrong language segment for this story's id, or an unknown id entirely -
  // send the reader to the story list for whatever language segment they
  // did give, rather than showing a broken/empty page.
  if (!story || story.language !== language) {
    return <Navigate to={language ? `/learn-languages/stories/${langSlug}` : '/learn-languages/stories'} replace />
  }

  const levelDef = getStoryLevelDef(story.level)
  const langLabel = LANG_LABEL_HE[language]
  const path = `/learn-languages/stories/${langSlug}/${story.id}`

  const otherStories = getStoriesByLanguage(language)
    .filter((s) => s.id !== story.id)
    .slice(0, 3)
    .map((s) => ({ id: s.id, title: s.title, href: `/learn-languages/stories/${langSlug}/${s.id}` }))

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: story.title,
    description: story.description,
    inLanguage: language,
    learningResourceType: 'Story',
    url: `${SITE_URL}${path}`,
    isPartOf: {
      '@type': 'CollectionPage',
      name: `סיפורים ב${langLabel}`,
      url: `${SITE_URL}/learn-languages/stories/${langSlug}`,
    },
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 pb-24">
      <SEOHead
        title={`${story.title} – סיפור ב${langLabel} (${levelDef.labelHe}) | נבון משחקים`}
        description={`${story.description} סיפור אינטראקטיבי ברמת ${levelDef.labelHe} ב${langLabel} - לחצו על כל מילה כדי לשמוע הגייה וללמוד את משמעותה.`}
        path={path}
        ogImage={story.image}
        ogType="article"
        jsonLd={jsonLd}
      />
      <Breadcrumbs
        items={[
          { label: 'דף הבית', href: '/' },
          { label: 'משחקים בשביל ללמוד', href: '/games/learning' },
          { label: 'לומדים שפות', href: '/learn-languages' },
          { label: 'סיפורים', href: '/learn-languages/stories' },
          { label: langLabel, href: `/learn-languages/stories/${langSlug}` },
          { label: story.title },
        ]}
      />
      <StoryReaderScreen
        story={story}
        isCompleted={progress.storiesCompleted.includes(story.id)}
        backHref={`/learn-languages/stories/${langSlug}`}
        onMarkRead={markStoryRead}
        onMarkCompleted={markStoryCompleted}
        otherStories={otherStories}
      />
    </div>
  )
}
