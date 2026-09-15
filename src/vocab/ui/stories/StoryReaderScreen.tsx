import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Story } from '../../data/stories/types'
import { resolveWordTranslation, tokenizeLine } from '../../data/stories'
import { getStoryLevelDef } from '../../data/stories/types'
import WordInfoCard from './WordInfoCard'
import StorySpeakButton from './StorySpeakButton'
import { useI18n } from '../../../i18n/LanguageContext'

export interface OtherStoryLink {
  id: string
  title: string
  href: string
}

interface StoryReaderScreenProps {
  story: Story
  isCompleted: boolean
  backHref: string
  onMarkRead: (storyId: string) => void
  onMarkCompleted: (storyId: string) => void
  /** A few sibling stories in the same language, linked at the bottom - real
      internal links for both readers and search-engine crawling. */
  otherStories?: OtherStoryLink[]
}

export default function StoryReaderScreen({ story, isCompleted, backHref, onMarkRead, onMarkCompleted, otherStories = [] }: StoryReaderScreenProps) {
  const { tr } = useI18n()
  const [activeToken, setActiveToken] = useState<string | null>(null)
  const levelDef = getStoryLevelDef(story.level)

  useEffect(() => {
    onMarkRead(story.id)
    // Only re-runs if the story itself changes - marking "read" is a one-shot per story visit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [story.id])

  const activeWord = activeToken
    ? (() => {
        const [, text] = activeToken.split('::')
        const match = resolveWordTranslation(story, text)
        return { text, translation: match?.translation ?? tr('story_no_meaning') }
      })()
    : null

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between gap-2">
        <Link
          to={backHref}
          aria-label={tr('story_back_to_list')}
          className="shrink-0 rounded-full bg-white px-4 py-2 font-fun text-sm font-extrabold text-ink shadow-card card-outline btn-pressable"
        >
          ⬅ {tr('common_back')}
        </Link>
        <div className="text-center">
          <h1 className="font-fun text-sm font-extrabold text-ink">📖 {story.title}</h1>
          <p className="text-xs font-bold text-ink/50">
            {levelDef.icon} {levelDef.labelHe}
          </p>
        </div>
        <div className="w-16 shrink-0" aria-hidden="true" />
      </div>

      <div className="rounded-blob bg-white p-5 shadow-pop card-outline sm:p-6">
        <p className="mb-4 text-center text-xs font-bold text-ink/40">👆 {tr('story_click_word_hint')}</p>
        <div className="space-y-3" dir={story.language === 'he' ? 'rtl' : 'ltr'}>
          {story.lines.map((line, lineIdx) => (
            <div key={lineIdx} className="flex items-start gap-2">
              <div className="mt-0.5 shrink-0">
                <StorySpeakButton text={line} lang={story.language} label={tr('story_hear_sentence')} size="sm" iconOnly />
              </div>
              <p className="text-lg leading-relaxed text-ink">
                {tokenizeLine(line).map((token, tokenIdx) => {
                  if (token.type === 'plain') return <span key={tokenIdx}>{token.text}</span>
                  const tokenKey = `${lineIdx}-${tokenIdx}::${token.text}`
                  const isActive = activeToken === tokenKey
                  return (
                    <button
                      key={tokenIdx}
                      onClick={() => setActiveToken(tokenKey)}
                      aria-label={`${tr('story_show_meaning')} ${token.text}`}
                      className={`rounded px-0.5 font-medium underline decoration-dotted decoration-2 underline-offset-4 transition-colors ${
                        isActive ? 'bg-grape-200 text-grape-800 decoration-grape-500' : 'text-sky-700 decoration-sky-400 hover:bg-sky-50'
                      }`}
                    >
                      {token.text}
                    </button>
                  )
                })}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 flex flex-col items-center gap-2">
        {isCompleted ? (
          <span className="rounded-full bg-grass-100 px-5 py-2.5 font-fun text-sm font-extrabold text-grass-700">✅ {tr('story_this_completed')}</span>
        ) : (
          <button
            onClick={() => onMarkCompleted(story.id)}
            className="rounded-full bg-grass-500 px-6 py-3 font-fun text-base font-extrabold text-white shadow-card btn-pressable"
          >
            ✓ {tr('story_mark_completed')}
          </button>
        )}
      </div>

      {otherStories.length > 0 && (
        <div className="mt-8 rounded-xl2 bg-white/70 p-4 shadow-card card-outline">
          <p className="mb-2 text-center text-xs font-bold text-ink/50">{tr('story_more_to_read')}</p>
          <ul className="flex flex-wrap justify-center gap-2">
            {otherStories.map((s) => (
              <li key={s.id}>
                <Link to={s.href} className="inline-block rounded-full bg-sky-50 px-3 py-1.5 text-xs font-bold text-sky-700 hover:bg-sky-100">
                  📖 {s.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activeWord && (
        <WordInfoCard word={activeWord.text} translation={activeWord.translation} language={story.language} onClose={() => setActiveToken(null)} />
      )}
    </div>
  )
}
