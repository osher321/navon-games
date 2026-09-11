import type { LangCode } from '../types'

// Flag emoji render as plain two-letter codes on many Windows browsers
// (no color-flag glyphs in the default system font), so we draw them
// ourselves to keep the premium look consistent across platforms.
interface FlagIconProps {
  lang: LangCode
  size?: number
  className?: string
}

export default function FlagIcon({ lang, size = 28, className = '' }: FlagIconProps) {
  const style = { width: size, height: size * 0.72 }
  const common = 'rounded-[3px] shadow-sm overflow-hidden shrink-0'

  switch (lang) {
    case 'he':
      return (
        <svg viewBox="0 0 30 21" style={style} className={`${common} ${className}`}>
          <rect width="30" height="21" fill="#ffffff" />
          <rect y="2.5" width="30" height="2.5" fill="#0038b8" />
          <rect y="16" width="30" height="2.5" fill="#0038b8" />
          <g transform="translate(15,10.5)" fill="none" stroke="#0038b8" strokeWidth="1">
            <polygon points="0,-5 4.3,2.5 -4.3,2.5" />
            <polygon points="0,5 4.3,-2.5 -4.3,-2.5" />
          </g>
        </svg>
      )
    case 'en':
      return (
        <svg viewBox="0 0 30 21" style={style} className={`${common} ${className}`}>
          <rect width="30" height="21" fill="#00247d" />
          <path d="M0,0 L30,21 M30,0 L0,21" stroke="#fff" strokeWidth="3.2" />
          <path d="M0,0 L30,21 M30,0 L0,21" stroke="#cf142b" strokeWidth="1.2" />
          <path d="M15,0 V21 M0,10.5 H30" stroke="#fff" strokeWidth="5" />
          <path d="M15,0 V21 M0,10.5 H30" stroke="#cf142b" strokeWidth="2.2" />
        </svg>
      )
    case 'ar':
      return (
        <svg viewBox="0 0 30 21" style={style} className={`${common} ${className}`}>
          <rect width="30" height="21" fill="#007a3d" />
          <rect y="8" width="30" height="5" fill="#ffffff" opacity="0.9" />
          <circle cx="15" cy="10.5" r="2.1" fill="#007a3d" />
        </svg>
      )
    case 'es':
      return (
        <svg viewBox="0 0 30 21" style={style} className={`${common} ${className}`}>
          <rect width="30" height="21" fill="#aa151b" />
          <rect y="5.25" width="30" height="10.5" fill="#f1bf00" />
        </svg>
      )
    default:
      return null
  }
}
