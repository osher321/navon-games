import type { LangCode } from '../types'
import { LANG_META } from '../i18n/translations'
import FlagIcon from './FlagIcon'

interface LanguageSelectorProps {
  value: LangCode
  onChange: (lang: LangCode) => void
  languages?: LangCode[]
}

export default function LanguageSelector({ value, onChange, languages = ['he', 'en', 'ar', 'es'] }: LanguageSelectorProps) {
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
            <span className="text-sm">{meta.native}</span>
          </button>
        )
      })}
    </div>
  )
}
