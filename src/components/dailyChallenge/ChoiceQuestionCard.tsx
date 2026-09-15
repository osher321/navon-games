import { useState } from 'react'
import { motion } from 'framer-motion'
import type { LangCode } from '../../types'
import type { ChoiceQuestion, QuestionKind } from '../../data/dailyChallenge/types'
import { QUESTION_KIND_META } from '../../data/dailyChallenge/types'
import { useSpeech } from '../../hooks/useSpeech'
import { useSound } from '../../hooks/useSound'
import { useI18n } from '../../i18n/LanguageContext'
import { LANG_META } from '../../i18n/translations'

// The prompt and the answer options aren't always in the same language (a
// "translation" question shows the target-language word as the prompt but
// Hebrew/English options, while "vocabulary" is the other way around) - so
// direction is computed per block, not once for the whole card.
const OPTIONS_IN_TARGET_LANG: Partial<Record<QuestionKind, boolean>> = { vocabulary: true, multiple_choice: true, fill_blank: true }

export default function ChoiceQuestionCard({ question, onAnswer }: { question: ChoiceQuestion; onAnswer: (correct: boolean) => void }) {
  const { speak, supported } = useSpeech()
  const { play } = useSound()
  const { tr } = useI18n()
  const [chosenId, setChosenId] = useState<string | null>(null)
  const [playing, setPlaying] = useState(false)
  const meta = QUESTION_KIND_META[question.kind]
  const referenceLang: LangCode = question.lang === 'he' ? 'en' : 'he'
  const promptLang = question.kind === 'vocabulary' || question.kind === 'multiple_choice' ? referenceLang : question.lang
  const optionsLang = OPTIONS_IN_TARGET_LANG[question.kind] ? question.lang : referenceLang
  const promptDir = LANG_META[promptLang].dir
  const optionsDir = LANG_META[optionsLang].dir

  const choose = (optId: string) => {
    if (chosenId) return
    setChosenId(optId)
    const isCorrect = optId === question.correctOptionId
    play(isCorrect ? 'correct' : 'wrong')
    setTimeout(() => onAnswer(isCorrect), 900)
  }

  return (
    <div className="mx-auto max-w-lg">
      <p className="mb-3 text-center text-xs font-bold text-ink/40">
        {meta.icon} {tr(meta.labelKey)}
        {question.storyTitle && <span> · 📖 {question.storyTitle}</span>}
      </p>

      <div className="mb-6 rounded-blob bg-white p-6 text-center shadow-pop card-outline">
        {question.promptEmoji && <div className="text-5xl">{question.promptEmoji}</div>}
        {question.promptText && (
          <div dir={promptDir} className="mt-2 font-fun text-2xl font-extrabold text-ink">
            {question.promptText}
          </div>
        )}
        {question.promptSpeakText && (
          <motion.button
            onClick={() => {
              if (playing) return
              setPlaying(true)
              speak(question.promptSpeakText!, question.promptSpeakLang!, () => setPlaying(false))
            }}
            whileTap={{ scale: 0.92 }}
            aria-label="האזן"
            className="mx-auto mt-3 grid h-16 w-16 place-items-center rounded-full bg-gradient-to-br from-grape-500 to-candy-500 text-3xl text-white shadow-card"
          >
            {playing ? '🔈' : '🔊'}
          </motion.button>
        )}
        {question.promptSpeakText && !supported && <p className="mt-2 text-xs text-ink/40">({question.promptSpeakText})</p>}
      </div>

      <div dir={optionsDir} className="grid grid-cols-2 gap-3">
        {question.options.map((opt) => {
          const isChosen = chosenId === opt.id
          const isCorrectOpt = opt.id === question.correctOptionId
          const showState = chosenId !== null
          const stateClass = !showState
            ? 'bg-white text-ink card-outline'
            : isCorrectOpt
              ? 'bg-grass-500 text-white'
              : isChosen
                ? 'bg-candy-500 text-white'
                : 'bg-white text-ink/40 card-outline'
          return (
            <motion.button
              key={opt.id}
              whileTap={{ scale: 0.95 }}
              disabled={showState}
              onClick={() => choose(opt.id)}
              className={`rounded-xl2 px-4 py-4 font-fun text-base font-extrabold shadow-card btn-pressable disabled:cursor-default ${stateClass}`}
            >
              {opt.label}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
