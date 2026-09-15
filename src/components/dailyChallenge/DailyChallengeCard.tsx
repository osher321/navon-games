import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useI18n } from '../../i18n/LanguageContext'
import { useDailyChallenge } from '../../hooks/useDailyChallenge'
import { QUESTIONS_PER_CHALLENGE } from '../../data/dailyChallenge/questionGenerator'
import Ltr from '../Ltr'

const MotionLink = motion(Link)

export default function DailyChallengeCard() {
  const { tr } = useI18n()
  const { challenge, isTodayActive, completedToday, streak, bestStreak } = useDailyChallenge()

  const inProgress = isTodayActive && challenge && !challenge.completed && challenge.currentIndex > 0

  const ctaLabel = completedToday ? tr('daily_challenge_completed_cta') : inProgress ? tr('daily_challenge_continue_cta') : tr('daily_challenge_start_cta')

  return (
    <section className="mb-10 overflow-hidden rounded-blob bg-gradient-to-br from-grape-600 via-candy-500 to-sunny-500 p-6 text-white shadow-pop card-outline sm:mb-12 sm:p-8">
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:justify-between sm:text-right">
        <div>
          <h2 className="font-fun text-2xl font-extrabold sm:text-3xl">🎯 {tr('daily_challenge_title')}</h2>
          <p className="mt-1 font-fun text-base font-extrabold text-white/95">{tr('daily_challenge_tagline')}</p>
          <p className="mt-1 max-w-md text-sm text-white/85">{tr('daily_challenge_desc')}</p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:justify-start">
            <span className="rounded-full bg-white/20 px-3 py-1.5 text-sm font-extrabold backdrop-blur-sm">
              📝 <Ltr>{QUESTIONS_PER_CHALLENGE}</Ltr> {tr('daily_challenge_questions_label')}
            </span>
            <span className="rounded-full bg-white/20 px-3 py-1.5 text-sm font-extrabold backdrop-blur-sm">
              🔥 <Ltr>{streak}</Ltr> {tr('daily_challenge_streak_label')}
              {bestStreak > streak && (
                <span className="text-white/70">
                  {' '}
                  · {tr('daily_challenge_best_streak_label')} <Ltr>{bestStreak}</Ltr>
                </span>
              )}
            </span>
          </div>
        </div>

        <MotionLink
          to="/learn-languages/daily-challenge"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`shrink-0 rounded-full px-7 py-4 font-fun text-lg font-extrabold shadow-card btn-pressable ${
            completedToday ? 'bg-white/20 text-white' : 'bg-white text-grape-700'
          }`}
        >
          {completedToday ? '✅' : inProgress ? '▶️' : '🚀'} {ctaLabel}
        </MotionLink>
      </div>
    </section>
  )
}
