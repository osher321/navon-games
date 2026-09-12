import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface InfoPanelProps {
  title: string
  onClose: () => void
  children: ReactNode
}

export default function InfoPanel({ title, onClose, children }: InfoPanelProps) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center rounded-blob bg-ink/90 px-6 py-14 sm:min-h-[75vh]">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 240, damping: 20 }}
        className="w-full max-w-md rounded-xl2 bg-white p-6 text-center shadow-pop"
      >
        <h2 className="font-fun text-2xl font-extrabold text-grape-600">{title}</h2>
        <div className="mt-4 space-y-2 text-sm text-ink/70">{children}</div>
        <button onClick={onClose} className="mt-6 rounded-full bg-grape-500 px-6 py-3 font-fun font-extrabold text-white shadow-card btn-pressable">
          ← Back
        </button>
      </motion.div>
    </div>
  )
}
