import { AnimatePresence, motion } from 'framer-motion'
import { useI18n } from '../i18n/LanguageContext'

interface FeedbackBubbleProps {
  status: 'correct' | 'wrong' | null
}

export default function FeedbackBubble({ status }: FeedbackBubbleProps) {
  const { tr } = useI18n()
  return (
    <div className="pointer-events-none fixed inset-x-0 top-20 z-50 flex justify-center">
      <AnimatePresence>
        {status && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: -20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 18 }}
            className={`rounded-full px-6 py-3 font-fun text-lg font-extrabold text-white shadow-pop ${
              status === 'correct' ? 'bg-grass-500' : 'bg-candy-500'
            }`}
          >
            {status === 'correct' ? `✅ ${tr('correct_answer')}` : `❌ ${tr('wrong_answer')}`}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
