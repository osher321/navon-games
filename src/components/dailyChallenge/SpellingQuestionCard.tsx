import { useState } from 'react'
import type { LangCode } from '../../types'
import type { SpellingQuestion } from '../../data/dailyChallenge/types'
import { QUESTION_KIND_META } from '../../data/dailyChallenge/types'
import { useSound } from '../../hooks/useSound'
import { useI18n } from '../../i18n/LanguageContext'
import { LANG_META } from '../../i18n/translations'

export default function SpellingQuestionCard({ question, onAnswer }: { question: SpellingQuestion; onAnswer: (correct: boolean) => void }) {
  const { play } = useSound()
  const { tr } = useI18n()
  const [value, setValue] = useState('')
  const [checked, setChecked] = useState<'correct' | 'wrong' | null>(null)
  const meta = QUESTION_KIND_META[question.kind]
  const referenceLang: LangCode = question.lang === 'he' ? 'en' : 'he'
  const promptDir = LANG_META[referenceLang].dir
  const inputDir = LANG_META[question.lang].dir

  const check = () => {
    if (checked) return
    const isCorrect = value.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
    setChecked(isCorrect ? 'correct' : 'wrong')
    play(isCorrect ? 'correct' : 'wrong')
    setTimeout(() => onAnswer(isCorrect), 1100)
  }

  return (
    <div className="mx-auto max-w-md">
      <p className="mb-3 text-center text-xs font-bold text-ink/40">
        {meta.icon} {tr(meta.labelKey)}
      </p>

      <div className="mb-6 rounded-blob bg-white p-6 text-center shadow-pop card-outline">
        {question.promptEmoji && <div className="text-5xl">{question.promptEmoji}</div>}
        <div dir={promptDir} className="mt-2 font-fun text-2xl font-extrabold text-ink">
          {question.promptText}
        </div>
      </div>

      <input
        dir={inputDir}
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && check()}
        disabled={!!checked}
        aria-label={`הקלידו את המילה ב${LANG_META[question.lang].native}`}
        placeholder={`...${LANG_META[question.lang].native}`}
        className={`mb-4 block w-full rounded-full border-2 px-5 py-3 text-center font-fun text-lg font-bold text-ink shadow-card outline-none ${
          checked === 'correct' ? 'border-grass-400 bg-grass-50' : checked === 'wrong' ? 'border-candy-400 bg-candy-50' : 'border-ink/10 bg-white focus:border-grape-400'
        }`}
      />
      {checked === 'wrong' && (
        <p dir={inputDir} className="mb-3 text-center text-sm font-bold text-candy-600">
          ✅ {question.correctAnswer}
        </p>
      )}

      <button
        onClick={check}
        disabled={!!checked || value.trim().length === 0}
        className="mx-auto block rounded-full bg-gradient-to-r from-grass-500 to-sky-500 px-8 py-3 font-fun font-extrabold text-white shadow-pop btn-pressable disabled:opacity-40"
      >
        בדקו ✅
      </button>
    </div>
  )
}
