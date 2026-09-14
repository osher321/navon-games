import { useEffect, useState } from 'react'
import type { Story, StoryLanguage } from '../../data/stories/types'
import { resolveWordTranslation, tokenizeLine } from '../../data/stories'
import { getStoryLevelDef } from '../../data/stories/types'
import WordInfoCard from './WordInfoCard'
import StorySpeakButton from './StorySpeakButton'

const SENTENCE_LABEL: Record<StoryLanguage, string> = {
  en: 'השמע את המשפט באנגלית',
  es: 'השמע את המשפט בספרדית',
  he: 'השמע את המשפט בעברית',
}

const NO_MEANING_LABEL: Record<StoryLanguage, string> = {
  en: 'אין תרגום זמין למילה זו',
  es: 'אין תרגום זמין למילה זו',
  he: 'אין הסבר זמין למילה זו',
}

interface StoryReaderScreenProps {
  story: Story
  isCompleted: boolean
  onBack: () => void
  onMarkRead: (storyId: string) => void
  onMarkCompleted: (storyId: string) => void
}

export default function StoryReaderScreen({ story, isCompleted, onBack, onMarkRead, onMarkCompleted }: StoryReaderScreenProps) {
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
        return { text, translation: match?.translation ?? NO_MEANING_LABEL[story.language] }
      })()
    : null

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          aria-label="חזרה לרשימת הסיפורים"
          className="shrink-0 rounded-full bg-white px-4 py-2 font-fun text-sm font-extrabold text-ink shadow-card card-outline btn-pressable"
        >
          ⬅ חזרה
        </button>
        <div className="text-center">
          <p className="font-fun text-sm font-extrabold text-ink">📖 {story.title}</p>
          <p className="text-xs font-bold text-ink/50">
            {levelDef.icon} {levelDef.labelHe}
          </p>
        </div>
        <div className="w-16 shrink-0" aria-hidden="true" />
      </div>

      <div className="rounded-blob bg-white p-5 shadow-pop card-outline sm:p-6">
        <p className="mb-4 text-center text-xs font-bold text-ink/40">
          {story.language === 'he' ? '👆 לחצו על כל מילה כדי לשמוע אותה ולראות הסבר' : '👆 לחצו על כל מילה כדי לשמוע אותה ולראות את התרגום'}
        </p>
        <div className="space-y-3" dir={story.language === 'he' ? 'rtl' : 'ltr'}>
          {story.lines.map((line, lineIdx) => (
            <div key={lineIdx} className="flex items-start gap-2">
              <div className="mt-0.5 shrink-0">
                <StorySpeakButton text={line} lang={story.language} label={SENTENCE_LABEL[story.language]} size="sm" iconOnly />
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
                      aria-label={story.language === 'he' ? `הצג הסבר למילה ${token.text}` : `הצג תרגום למילה ${token.text}`}
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
          <span className="rounded-full bg-grass-100 px-5 py-2.5 font-fun text-sm font-extrabold text-grass-700">✅ סיפור זה הושלם</span>
        ) : (
          <button
            onClick={() => onMarkCompleted(story.id)}
            className="rounded-full bg-grass-500 px-6 py-3 font-fun text-base font-extrabold text-white shadow-card btn-pressable"
          >
            ✓ סמנו כהושלם
          </button>
        )}
      </div>

      {activeWord && (
        <WordInfoCard word={activeWord.text} translation={activeWord.translation} language={story.language} onClose={() => setActiveToken(null)} />
      )}
    </div>
  )
}
