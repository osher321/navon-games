import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Story } from '../../data/stories/types'
import { getStoryLevelDef } from '../../data/stories/types'

const MotionLink = motion(Link)

interface StoriesListScreenProps {
  stories: Story[]
  readIds: string[]
  completedIds: string[]
  /** Builds the real route for a story (not just a click handler) - Google's
      crawler discovers internal links from `<a href>`, not from onClick JS. */
  getStoryHref: (storyId: string) => string
  backHref: string
}

export default function StoriesListScreen({ stories, readIds, completedIds, getStoryHref, backHref }: StoriesListScreenProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between gap-2">
        <Link
          to={backHref}
          aria-label="חזרה ללומדים שפות"
          className="shrink-0 rounded-full bg-white px-4 py-2 font-fun text-sm font-extrabold text-ink shadow-card card-outline btn-pressable"
        >
          ⬅ חזרה
        </Link>
        {/* The page-level header above this component already shows the
            language-specific title ("סיפורים באנגלית"/"סיפורים בספרדית") -
            this row only needs the subtitle, so nothing here duplicates
            (and risks hardcoding) that title. */}
        <p className="text-center text-xs font-bold text-ink/50">בחרו סיפור להתחלה</p>
        <div className="w-16 shrink-0" aria-hidden="true" />
      </div>

      <div className="space-y-3">
        {stories.map((story) => {
          const levelDef = getStoryLevelDef(story.level)
          const isCompleted = completedIds.includes(story.id)
          const isRead = readIds.includes(story.id)
          return (
            <motion.div key={story.id} whileTap={{ scale: 0.98 }} className="overflow-hidden rounded-xl2 bg-white shadow-card card-outline">
              <img
                src={story.image}
                alt={story.imageAlt}
                loading="lazy"
                width={800}
                height={500}
                className="aspect-[8/5] w-full object-cover"
              />
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-fun text-base font-extrabold text-ink">📖 {story.title}</p>
                    <p className="mt-0.5 text-xs text-ink/50">{story.description}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-bold text-ink/60">
                      <span>
                        {levelDef.icon} {levelDef.labelHe}
                      </span>
                      <span>·</span>
                      <span>{story.lines.length} שורות</span>
                      {isCompleted && <span className="rounded-full bg-grass-100 px-2 py-0.5 text-grass-700">✅ הושלם</span>}
                      {!isCompleted && isRead && <span className="rounded-full bg-sky-100 px-2 py-0.5 text-sky-700">👀 נקרא</span>}
                    </div>
                  </div>
                </div>
                <MotionLink
                  to={getStoryHref(story.id)}
                  whileTap={{ scale: 0.97 }}
                  className="mt-3 block w-full rounded-full bg-grape-500 px-5 py-2.5 text-center font-fun text-sm font-extrabold text-white shadow-card btn-pressable"
                >
                  {isRead ? '📖 המשיכו לקרוא' : '▶ התחילו לקרוא'}
                </MotionLink>
              </div>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
