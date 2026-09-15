import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { LangCode } from '../types'
import { useI18n } from '../i18n/LanguageContext'
import { LANG_META } from '../i18n/translations'
import { useDailyChallenge } from '../hooks/useDailyChallenge'
import { QUESTIONS_PER_CHALLENGE } from '../data/dailyChallenge/questionGenerator'
import { CHALLENGE_LEVELS, QUESTION_KIND_META, getChallengeLevelDef } from '../data/dailyChallenge/types'
import type { ChallengeLevel, Question } from '../data/dailyChallenge/types'
import QuestionCard from '../components/dailyChallenge/QuestionCard'
import ProgressBar from '../components/ProgressBar'
import Breadcrumbs from '../components/Breadcrumbs'
import Ltr from '../components/Ltr'
import { useSpeech } from '../hooks/useSpeech'
import SEOHead from '../seo/SEOHead'

const PICKABLE_LANGS: LangCode[] = ['en', 'es', 'he']

function speakTextFor(q: Question): { text: string; lang: LangCode } | null {
  if (q.kind === 'scramble') return { text: q.correctOrder.join(' '), lang: q.lang }
  if ('promptSpeakText' in q && q.promptSpeakText) return { text: q.promptSpeakText, lang: q.promptSpeakLang ?? q.lang }
  return null
}

function useCountdownToNextChallenge() {
  const [remaining, setRemaining] = useState('')
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0)
      const ms = Math.max(0, next.getTime() - now.getTime())
      const h = Math.floor(ms / 3600000)
      const m = Math.floor((ms % 3600000) / 60000)
      const s = Math.floor((ms % 60000) / 1000)
      setRemaining(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])
  return remaining
}

export default function DailyChallengePage() {
  const { tr } = useI18n()
  const { speak } = useSpeech()
  const { challenge, isTodayActive, questions, mistakeQuestions, suggestedLevel, startChallenge, submitAnswer, finishChallenge, streak } = useDailyChallenge()
  const countdown = useCountdownToNextChallenge()

  const [pickedLang, setPickedLang] = useState<LangCode>('en')
  const [autoLevel, setAutoLevel] = useState(true)
  const [pickedLevel, setPickedLevel] = useState<ChallengeLevel>('beginner')

  const [practiceQuestions, setPracticeQuestions] = useState<Question[] | null>(null)
  const [practiceIndex, setPracticeIndex] = useState(0)
  const [practiceDone, setPracticeDone] = useState(false)

  const startTimeRef = useRef(Date.now())
  const finishedRef = useRef(false)

  const effectiveSuggestedLevel = useMemo(() => suggestedLevel(pickedLang), [suggestedLevel, pickedLang])

  useEffect(() => {
    if (!challenge || !isTodayActive || challenge.completed) return
    if (challenge.currentIndex >= questions.length && questions.length > 0 && !finishedRef.current) {
      finishedRef.current = true
      const elapsed = Math.max(1, Math.round((Date.now() - startTimeRef.current) / 1000))
      finishChallenge(elapsed)
    }
  }, [challenge, isTodayActive, questions.length, finishChallenge])

  const path = '/learn-languages/daily-challenge'
  const seoTitle = `🎯 ${tr('daily_challenge_title')} | נבון משחקים`

  const breadcrumbs = (
    <Breadcrumbs
      items={[{ label: tr('nav_home'), href: '/' }, { label: tr('cat_languages'), href: '/learn-languages' }, { label: tr('daily_challenge_title') }]}
    />
  )

  // --- Phase 1: no challenge started yet today - language + level picker ---
  if (!isTodayActive || !challenge) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 pb-24">
        <SEOHead title={seoTitle} description={tr('daily_challenge_desc')} path={path} noindex />
        {breadcrumbs}

        <div className="rounded-blob bg-gradient-to-br from-grape-600 via-candy-500 to-sunny-500 p-6 text-center text-white shadow-pop sm:p-8">
          <h1 className="font-fun text-3xl font-extrabold">🎯 {tr('daily_challenge_title')}</h1>
          <p className="mt-2 font-fun text-base font-extrabold text-white/95">{tr('daily_challenge_tagline')}</p>
        </div>

        <div className="mt-6 rounded-xl2 bg-white/70 p-5 shadow-card card-outline sm:p-6">
          <h2 className="mb-4 text-center font-fun text-xl font-extrabold text-grape-600">{tr('daily_challenge_pick_lang_title')}</h2>
          <div className="flex justify-center gap-3">
            {PICKABLE_LANGS.map((l) => (
              <motion.button
                key={l}
                whileTap={{ scale: 0.95 }}
                onClick={() => setPickedLang(l)}
                aria-pressed={pickedLang === l}
                className={`flex flex-col items-center gap-1 rounded-xl2 px-5 py-4 font-fun font-extrabold shadow-card btn-pressable ${
                  pickedLang === l ? 'bg-grape-500 text-white' : 'bg-white text-ink card-outline'
                }`}
              >
                <span className="text-3xl">{LANG_META[l].flag}</span>
                <span className="text-sm">{LANG_META[l].label}</span>
              </motion.button>
            ))}
          </div>

          <h2 className="mb-4 mt-8 text-center font-fun text-xl font-extrabold text-grape-600">{tr('daily_challenge_pick_level_title')}</h2>
          <div className="flex flex-wrap justify-center gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setAutoLevel(true)}
              aria-pressed={autoLevel}
              className={`rounded-full px-4 py-3 font-fun text-sm font-extrabold shadow-card btn-pressable ${
                autoLevel ? 'bg-sunny-500 text-white' : 'bg-white text-ink card-outline'
              }`}
            >
              {tr('daily_challenge_auto_level')}
            </motion.button>
            {CHALLENGE_LEVELS.map((lvl) => (
              <motion.button
                key={lvl.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setAutoLevel(false)
                  setPickedLevel(lvl.id)
                }}
                aria-pressed={!autoLevel && pickedLevel === lvl.id}
                className={`rounded-full px-4 py-3 font-fun text-sm font-extrabold shadow-card btn-pressable ${
                  !autoLevel && pickedLevel === lvl.id ? 'bg-grape-500 text-white' : 'bg-white text-ink card-outline'
                }`}
              >
                {lvl.icon} {tr(`level_${lvl.id}`)}
              </motion.button>
            ))}
          </div>
          {autoLevel && (
            <p className="mt-3 text-center text-xs font-bold text-ink/50">
              {getChallengeLevelDef(effectiveSuggestedLevel).icon} {tr(`level_${effectiveSuggestedLevel}`)}
            </p>
          )}

          <p className="mx-auto mt-6 max-w-sm text-center text-xs text-ink/40">{tr('daily_challenge_locked_note')}</p>

          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => {
              finishedRef.current = false
              startTimeRef.current = Date.now()
              startChallenge(pickedLang, autoLevel ? effectiveSuggestedLevel : pickedLevel, autoLevel)
            }}
            className="mx-auto mt-6 block rounded-full bg-gradient-to-r from-grass-500 to-sky-500 px-8 py-4 font-fun text-lg font-extrabold text-white shadow-pop btn-pressable"
          >
            🚀 {tr('daily_challenge_start_button')}
          </motion.button>
        </div>
      </div>
    )
  }

  // --- Phase 2: challenge completed today - results + mistakes review ---
  if (challenge.completed) {
    const correct = challenge.answers.filter(Boolean).length
    const total = challenge.answers.length || QUESTIONS_PER_CHALLENGE
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0

    const startPractice = () => {
      setPracticeQuestions(mistakeQuestions)
      setPracticeIndex(0)
      setPracticeDone(false)
    }

    return (
      <div className="mx-auto max-w-xl px-4 py-8 pb-24">
        <SEOHead title={seoTitle} description={tr('daily_challenge_desc')} path={path} noindex />
        {breadcrumbs}

        <div className="rounded-blob bg-gradient-to-br from-grass-500 to-sky-500 p-6 text-center text-white shadow-pop sm:p-8">
          <h1 className="font-fun text-3xl font-extrabold">🎉 {tr('daily_challenge_results_title')}</h1>
          {challenge.perfect && <p className="mt-2 font-fun text-lg font-extrabold">{tr('daily_challenge_perfect_badge')}</p>}

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl2 bg-white/20 p-3">
              <div className="font-fun text-xl font-extrabold">
                <Ltr>
                  {correct}/{total}
                </Ltr>
              </div>
              <div className="text-xs text-white/85">{tr('daily_challenge_results_correct_label')}</div>
            </div>
            <div className="rounded-xl2 bg-white/20 p-3">
              <div className="font-fun text-xl font-extrabold">
                <Ltr>{accuracy}%</Ltr>
              </div>
              <div className="text-xs text-white/85">{tr('daily_challenge_results_accuracy_label')}</div>
            </div>
            <div className="rounded-xl2 bg-white/20 p-3">
              <div className="font-fun text-xl font-extrabold">
                <Ltr>+{challenge.xpEarned}</Ltr>
              </div>
              <div className="text-xs text-white/85">{tr('daily_challenge_results_xp_label')}</div>
            </div>
            <div className="rounded-xl2 bg-white/20 p-3">
              <div className="font-fun text-xl font-extrabold">🔥 <Ltr>{streak}</Ltr></div>
              <div className="text-xs text-white/85">{tr('daily_challenge_results_streak_label')}</div>
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl2 bg-white/70 p-5 shadow-card card-outline sm:p-6">
          <h2 className="mb-4 text-center font-fun text-lg font-extrabold text-grape-600">
            ❌ {tr('daily_challenge_mistakes_title')}
          </h2>

          {mistakeQuestions.length === 0 ? (
            <p className="text-center text-sm font-bold text-ink/50">{tr('daily_challenge_no_mistakes')}</p>
          ) : practiceQuestions && !practiceDone ? (
            <div>
              <ProgressBar value={practiceIndex} max={practiceQuestions.length} colorFrom="from-candy-400" colorTo="to-grape-400" />
              <p className="mt-1 mb-4 text-center text-xs font-bold text-ink/50">
                <Ltr>
                  {practiceIndex + 1} / {practiceQuestions.length}
                </Ltr>
              </p>
              <QuestionCard
                key={practiceQuestions[practiceIndex].id}
                question={practiceQuestions[practiceIndex]}
                onAnswer={() => {
                  if (practiceIndex + 1 >= practiceQuestions.length) {
                    setPracticeDone(true)
                  } else {
                    setPracticeIndex((i) => i + 1)
                  }
                }}
              />
            </div>
          ) : practiceDone ? (
            <p className="text-center text-sm font-bold text-grass-600">{tr('daily_challenge_practice_done')}</p>
          ) : (
            <>
              <ul className="mb-4 space-y-2">
                {mistakeQuestions.map((q) => {
                  const speakInfo = speakTextFor(q)
                  const label = q.kind === 'spelling' ? q.correctAnswer : q.kind === 'scramble' ? q.correctOrder.join(' ') : q.promptText || q.options.find((o) => o.id === q.correctOptionId)?.label
                  return (
                    <li key={q.id} className="flex items-center justify-between gap-2 rounded-xl2 bg-white p-3 shadow-card card-outline">
                      <span className="flex items-center gap-2 text-sm font-bold text-ink">
                        <span>{QUESTION_KIND_META[q.kind].icon}</span>
                        <span dir={LANG_META[q.lang].dir}>{label}</span>
                      </span>
                      {speakInfo && (
                        <button
                          onClick={() => speak(speakInfo.text, speakInfo.lang)}
                          aria-label={tr('listen')}
                          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-grape-100 text-lg text-grape-600"
                        >
                          🔊
                        </button>
                      )}
                    </li>
                  )
                })}
              </ul>
              <button
                onClick={startPractice}
                className="mx-auto block rounded-full bg-gradient-to-r from-candy-500 to-grape-500 px-6 py-3 font-fun font-extrabold text-white shadow-pop btn-pressable"
              >
                🔁 {tr('daily_challenge_practice_mistakes_cta')}
              </button>
            </>
          )}
        </div>

        <div className="mt-6 rounded-xl2 bg-white/70 p-5 text-center shadow-card card-outline">
          <p className="font-fun text-sm font-extrabold text-ink/60">
            ⏰ {tr('daily_challenge_next_in_label')} <Ltr className="font-mono">{countdown}</Ltr>
          </p>
        </div>

        <Link to="/learn-languages" className="mx-auto mt-6 block w-fit text-center text-sm font-bold text-grape-600 underline">
          ← {tr('daily_challenge_back_to_hub')}
        </Link>
      </div>
    )
  }

  // --- Phase 3: in progress - render the current question ---
  const current = questions[challenge.currentIndex]
  if (!current) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 pb-24">
        <SEOHead title={seoTitle} description={tr('daily_challenge_desc')} path={path} noindex />
        {breadcrumbs}
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 pb-24">
      <SEOHead title={seoTitle} description={tr('daily_challenge_desc')} path={path} noindex />
      {breadcrumbs}

      <div className="mb-6">
        <ProgressBar value={challenge.currentIndex} max={questions.length} colorFrom="from-grape-500" colorTo="to-candy-500" />
        <p className="mt-1 text-center text-xs font-bold text-ink/50">
          <Ltr>
            {challenge.currentIndex + 1} / {questions.length}
          </Ltr>
        </p>
      </div>

      <QuestionCard
        key={current.id}
        question={current}
        onAnswer={(isCorrect) => submitAnswer(isCorrect, current.sourceWordId)}
      />
    </div>
  )
}
