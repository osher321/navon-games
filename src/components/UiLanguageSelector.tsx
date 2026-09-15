import { useI18n } from '../i18n/LanguageContext'
import { LANG_META } from '../i18n/translations'
import FlagIcon from './FlagIcon'

// The 3 site-interface languages this feature exposes (per the explicit
// request) - Arabic dictionaries still exist in translations.ts (t()'s
// fallback chain and LangCode both still cover it), it's just never shown
// as a selectable interface language here or anywhere else on the site.
const UI_LANGS = ['he', 'en', 'es'] as const

interface UiLanguageSelectorProps {
  /** 'cards' (default) for the prominent home-page picker, 'compact' for a small row that fits a header/dropdown. */
  variant?: 'cards' | 'compact'
}

/** Switches the site's own interface language (nav, buttons, headings) -
    entirely independent from LanguageSelector, which picks which language
    a learner is *studying*. Reusable so Home, the Navbar, and Settings all
    drive the exact same persisted state instead of duplicating this UI. */
export default function UiLanguageSelector({ variant = 'cards' }: UiLanguageSelectorProps) {
  const { lang, setLang } = useI18n()

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1" role="group" aria-label="Site language">
        {UI_LANGS.map((l) => {
          const meta = LANG_META[l]
          const active = lang === l
          return (
            <button
              key={l}
              onClick={() => setLang(l)}
              aria-pressed={active}
              aria-label={meta.native}
              title={meta.native}
              className={`grid h-9 w-9 place-items-center rounded-full shadow-card btn-pressable transition-all ${
                active ? 'ring-2 ring-grape-500' : 'opacity-70 hover:opacity-100'
              }`}
            >
              <FlagIcon lang={l} size={22} />
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-wrap justify-center gap-3" role="group" aria-label="Site language">
      {UI_LANGS.map((l) => {
        const meta = LANG_META[l]
        const active = lang === l
        return (
          <button
            key={l}
            onClick={() => setLang(l)}
            aria-pressed={active}
            className={`flex min-w-[120px] flex-col items-center gap-2 rounded-xl2 px-5 py-4 font-fun font-extrabold shadow-card card-outline btn-pressable transition-all ${
              active ? 'scale-105 bg-grape-500 text-white' : 'bg-white text-ink hover:-translate-y-0.5'
            }`}
          >
            <FlagIcon lang={l} size={40} />
            <span>{meta.native}</span>
          </button>
        )
      })}
    </div>
  )
}
