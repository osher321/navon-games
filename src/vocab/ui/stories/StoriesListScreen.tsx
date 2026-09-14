import { motion } from 'framer-motion'
import type { Story } from '../../data/stories/types'
import { getStoryLevelDef } from '../../data/stories/types'

interface StoriesListScreenProps {
  stories: Story[]
  readIds: string[]
  completedIds: string[]
  onSelectStory: (storyId: string) => void
  onBack: () => void
}

export default function StoriesListScreen({ stories, readIds, completedIds, onSelectStory, onBack }: StoriesListScreenProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          aria-label="חזרה ללומדים שפות"
          className="shrink-0 rounded-full bg-white px-4 py-2 font-fun text-sm font-extrabold text-ink shadow-card card-outline btn-pressable"
        >
          ⬅ חזרה
        </button>
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
            <motion.div key={story.id} whileTap={{ scale: 0.98 }} className="rounded-xl2 bg-white p-4 shadow-card card-outline">
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
              <button
                onClick={() => onSelectStory(story.id)}
                className="mt-3 w-full rounded-full bg-grape-500 px-5 py-2.5 font-fun text-sm font-extrabold text-white shadow-card btn-pressable"
              >
                {isRead ? '📖 המשיכו לקרוא' : '▶ התחילו לקרוא'}
              </button>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
