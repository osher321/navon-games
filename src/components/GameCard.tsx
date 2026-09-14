import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import type { GameDef } from '../types'
import { useI18n } from '../i18n/LanguageContext'

const MotionLink = motion(Link)

interface GameCardProps {
  game: GameDef
  href?: string
  badge?: string
}

/** A real `<a href>` (via react-router's Link), not a button+navigate() -
    Google's crawler discovers internal links from anchor tags, so every
    game/story/language card site-wide needs to render as one. */
export default function GameCard({ game, href, badge }: GameCardProps) {
  const { tr } = useI18n()
  const target = href ?? `/play/${game.id}`

  return (
    <MotionLink
      to={target}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={`group relative flex flex-col items-center gap-2 rounded-xl2 bg-gradient-to-br ${game.color} p-5 text-white shadow-pop card-outline btn-pressable`}
    >
      {game.isNew && (
        <span className="absolute -top-2 -right-2 rotate-6 rounded-full bg-candy-500 px-2.5 py-1 text-[11px] font-extrabold shadow-card font-fun">
          ✨ {tr('badge_new')}
        </span>
      )}
      {badge && (
        <span className="absolute -top-2 -left-2 -rotate-6 rounded-full bg-white/90 px-2 py-1 text-[11px] font-extrabold text-ink shadow-card font-fun">
          {badge}
        </span>
      )}
      <div className="grid h-16 w-16 place-items-center rounded-full bg-white/25 text-4xl transition-transform group-hover:animate-wiggle">
        {game.icon}
      </div>
      <div className="text-center font-fun text-base font-extrabold leading-tight">{tr(game.nameKey)}</div>
      <div className="text-center text-xs font-medium text-white/85">{tr(game.descKey)}</div>
    </MotionLink>
  )
}
