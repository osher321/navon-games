import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { Story } from '../../data/stories/types'
import { resolveWordTranslation, tokenizeLine } from '../../data/stories'
import { getStoryLevelDef } from '../../data/stories/types'
import WordInfoCard from './WordInfoCard'
import StorySpeakButton from './StorySpeakButton'
import { useStoryNarration, NARRATION_SPEEDS, type NarrationSpeed } from './useStoryNarration'
import { useI18n } from '../../../i18n/LanguageContext'

const SPEED_LABEL: Record<NarrationSpeed, string> = { 0.6: '🐢🐢', 0.75: '🐢', 1: '▶️' }

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
  const narration = useStoryNarration(story.lines, story.language)
  const contentDir = story.language === 'he' ? 'rtl' : 'ltr'

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
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <p className="text-xs font-bold text-ink/40">👆 {tr('story_click_word_hint')}</p>
          {narration.supported && (
            <button
              onClick={() => narration.setStudyMode(!narration.studyMode)}
              aria-pressed={narration.studyMode}
              className={`rounded-full px-3 py-1.5 text-xs font-extrabold shadow-card btn-pressable ${
                narration.studyMode ? 'bg-grape-500 text-white' : 'bg-white text-ink/60 card-outline'
              }`}
            >
              📚 {tr('story_study_mode')}
            </button>
          )}
        </div>

        {narration.supported && narration.studyMode && (
          <div className="mb-5 rounded-xl2 bg-grape-50 p-3 sm:p-4">
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                onClick={narration.prev}
                aria-label={tr('story_player_prev')}
                className="grid h-11 w-11 place-items-center rounded-full bg-white text-lg shadow-card btn-pressable"
              >
                ⏮️
              </button>
              <button
                onClick={() => (narration.isPlaying ? narration.pause() : narration.play())}
                aria-label={narration.isPlaying ? tr('story_player_pause') : tr('story_player_play')}
                className="grid h-14 w-14 place-items-center rounded-full bg-grape-500 text-2xl text-white shadow-card btn-pressable"
              >
                {narration.isPlaying ? '⏸️' : '▶️'}
              </button>
              <button
                onClick={narration.stop}
                aria-label={tr('story_player_stop')}
                className="grid h-11 w-11 place-items-center rounded-full bg-white text-lg shadow-card btn-pressable"
              >
                ⏹️
              </button>
              <button
                onClick={narration.next}
                aria-label={tr('story_player_next')}
                className="grid h-11 w-11 place-items-center rounded-full bg-white text-lg shadow-card btn-pressable"
              >
                ⏭️
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
              <span className="text-xs font-bold text-ink/40">🐢 {tr('story_player_speed')}</span>
              {NARRATION_SPEEDS.map((s) => (
                <button
                  key={s}
                  onClick={() => narration.setRate(s)}
                  aria-pressed={narration.rate === s}
                  className={`rounded-full px-3 py-1.5 text-xs font-extrabold shadow-card btn-pressable ${
                    narration.rate === s ? 'bg-sunny-400 text-ink' : 'bg-white text-ink/60'
                  }`}
                >
                  {SPEED_LABEL[s]} {s}x
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3" dir={contentDir}>
          {story.lines.map((line, lineIdx) => {
            const isActiveLine = narration.activeIndex === lineIdx
            return (
              <motion.div
                key={lineIdx}
                animate={{ backgroundColor: isActiveLine ? 'rgba(196,181,253,0.35)' : 'rgba(0,0,0,0)' }}
                className="flex items-start gap-2 rounded-xl2 p-1.5 -m-1.5"
              >
                <div className="mt-0.5 shrink-0">
                  {narration.supported ? (
                    <button
                      onClick={() => narration.replaySentence(lineIdx)}
                      aria-label={tr('story_hear_sentence')}
                      className={`grid h-9 w-9 place-items-center rounded-full text-sm shadow-card card-outline btn-pressable ${
                        isActiveLine && narration.isPlaying ? 'bg-grape-500 text-white' : 'bg-sky-100 text-sky-700'
                      }`}
                    >
                      {isActiveLine && narration.isPlaying ? '▶️' : '🔊'}
                    </button>
                  ) : (
                    <StorySpeakButton text={line} lang={story.language} label={tr('story_hear_sentence')} size="sm" iconOnly />
                  )}
                </div>
                <p className={`text-lg leading-relaxed ${isActiveLine ? 'font-bold text-grape-800' : 'text-ink'}`}>
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
              </motion.div>
            )
          })}
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
        <WordInfoCard
          word={activeWord.text}
          translation={activeWord.translation}
          language={story.language}
          onClose={() => setActiveToken(null)}
          rate={narration.rate}
        />
      )}
    </div>
  )
}
