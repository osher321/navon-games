import { createContext, useContext, useEffect, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { LangCode } from '../types'
import { LANG_META, t } from './translations'
import { useProgress } from '../hooks/useProgress'

interface I18nContextValue {
  lang: LangCode
  dir: 'rtl' | 'ltr'
  setLang: (l: LangCode) => void
  tr: (key: string) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const { progress, setSelectedLanguage } = useProgress()
  const lang = progress.interfaceLanguage
  const dir = LANG_META[lang].dir

  useEffect(() => {
    document.documentElement.lang = lang
    document.documentElement.dir = dir
  }, [lang, dir])

  const value = useMemo<I18nContextValue>(
    () => ({
      lang,
      dir,
      setLang: setSelectedLanguage,
      tr: (key: string) => t(lang, key),
    }),
    [lang, dir, setSelectedLanguage]
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}
