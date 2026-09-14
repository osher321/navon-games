import type { LangCode } from '../types'
import { LANG_META } from '../i18n/translations'
import FlagIcon from './FlagIcon'

interface LanguageSelectorProps {
  value: LangCode
  onChange: (lang: LangCode) => void
  languages?: LangCode[]
}

// Arabic has been removed as a learnable/selectable language site-wide -
// this one default drives every call site (Home's shortcut, the Languages
// hub, and Settings), so removing it here removes it everywhere at once.
export default function LanguageSelector({ value, onChange, languages = ['he', 'en', 'es'] }: LanguageSelectorProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3">
      {languages.map((lang) => {
        const meta = LANG_META[lang]
        const active = value === lang
        return (
          <button
            key={lang}
            onClick={() => onChange(lang)}
            className={`flex min-w-[104px] flex-col items-center gap-1 rounded-xl2 px-5 py-3 font-fun font-extrabold shadow-card card-outline btn-pressable transition-all ${
              active ? 'scale-105 bg-grape-500 text-white' : 'bg-white text-ink hover:-translate-y-0.5'
            }`}
          >
            <FlagIcon lang={lang} size={36} />
            {/* Hebrew name ("אנגלית"/"ספרדית"), not the language's own native-script name - the interface is always Hebrew. */}
            <span className="text-sm">{meta.label}</span>
          </button>
        )
      })}
    </div>
  )
}
