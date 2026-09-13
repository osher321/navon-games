import { AnimatePresence, motion } from 'framer-motion'
import type { VocabAchievementDef } from '../progress/achievements'

interface AchievementToastProps {
  achievement: VocabAchievementDef | null
}

/** One achievement at a time, auto-managed by the caller's queue - mirrors the site's own FeedbackBubble pattern (fixed, centered, pointer-events-none). */
export default function AchievementToast({ achievement }: AchievementToastProps) {
  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-50 flex justify-center px-4">
      <AnimatePresence>
        {achievement && (
          <motion.div
            role="status"
            initial={{ scale: 0.6, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.7, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            className="flex items-center gap-3 rounded-full bg-white px-5 py-3 shadow-pop card-outline"
          >
            <span className="text-2xl">{achievement.icon}</span>
            <div className="text-start">
              <p className="font-fun text-sm font-extrabold text-ink">{achievement.title}</p>
              <p className="text-xs text-ink/50">{achievement.description}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
