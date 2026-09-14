import { useEffect } from 'react'
import { motion } from 'framer-motion'
import type { StoryLanguage } from '../../data/stories/types'
import StorySpeakButton from './StorySpeakButton'
import Ltr from '../../../components/Ltr'

interface WordInfoCardProps {
  word: string
  translation: string
  language: StoryLanguage
  onClose: () => void
}

/** Flag + Hebrew label per story language - one more entry here is the entire cost of a future additional language. */
const LANGUAGE_META: Record<StoryLanguage, { flag: string; labelHe: string }> = {
  en: { flag: '🇬🇧', labelHe: 'באנגלית' },
  es: { flag: '🇪🇸', labelHe: 'בספרדית' },
  he: { flag: '🇮🇱', labelHe: 'בעברית' },
}

/**
 * A centered, fixed-position card rather than a tooltip anchored to the
 * clicked word - this is what guarantees it never overflows the screen
 * edges (the explicit mobile requirement), regardless of where in the
 * story the word sits.
 *
 * Hebrew stories get a different internal layout than English/Spanish
 * ones: a foreign-language word needs both itself AND a Hebrew
 * translation shown (two sections, two "listen" buttons), but a Hebrew
 * word is already in the interface language - there's nothing to
 * translate it INTO, so it gets one section (the word + a plain-Hebrew
 * meaning/explanation) and a single "listen" button.
 */
export default function WordInfoCard({ word, translation, language, onClose }: WordInfoCardProps) {
  const meta = LANGUAGE_META[language]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-4" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        role="dialog"
        aria-modal="true"
        aria-label={`מידע על המילה ${word}`}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-xs rounded-blob bg-white p-6 text-center shadow-pop card-outline"
      >
        <button
          onClick={onClose}
          aria-label="סגירה"
          className="absolute end-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink shadow-card btn-pressable"
        >
          ✕
        </button>

        {language === 'he' ? (
          <>
            <p className="text-xs font-bold text-ink/40">
              {meta.flag} מילה {meta.labelHe}
            </p>
            <div className="mt-1 font-fun text-2xl font-extrabold text-ink">{word}</div>
            <div className="mt-3 flex justify-center">
              <StorySpeakButton text={word} lang="he" label="האזן למילה" />
            </div>

            <div className="my-4 h-px bg-ink/10" />

            <p className="text-xs font-bold text-ink/40">💡 הסבר / משמעות</p>
            <div className="mt-1 text-base font-bold text-grape-600">{translation}</div>
          </>
        ) : (
          <>
            <p className="text-xs font-bold text-ink/40">
              {meta.flag} {meta.labelHe}
            </p>
            <div className="mt-1 font-fun text-2xl font-extrabold text-ink">
              <Ltr>{word}</Ltr>
            </div>
            <div className="mt-3 flex justify-center">
              <StorySpeakButton text={word} lang={language} label={`האזן ${meta.labelHe}`} />
            </div>

            <div className="my-4 h-px bg-ink/10" />

            <p className="text-xs font-bold text-ink/40">🇮🇱 בעברית</p>
            <div className="mt-1 font-fun text-2xl font-extrabold text-grape-600">{translation}</div>
            <div className="mt-3 flex justify-center">
              <StorySpeakButton text={translation} lang="he" label="האזן בעברית" />
            </div>
          </>
        )}
      </motion.div>
    </div>
  )
}
