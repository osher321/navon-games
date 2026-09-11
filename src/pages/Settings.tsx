import { useState } from 'react'
import { useI18n } from '../i18n/LanguageContext'
import { useProgress } from '../hooks/useProgress'
import LanguageSelector from '../components/LanguageSelector'

export default function Settings() {
  const { tr, lang, setLang } = useI18n()
  const { progress, toggleSound, resetProgress } = useProgress()
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="mx-auto max-w-lg px-4 py-8 pb-24">
      <h1 className="mb-8 text-center font-fun text-3xl font-extrabold text-grape-600">{tr('settings_title')}</h1>

      <section className="mb-8 rounded-xl2 bg-white p-5 shadow-card card-outline">
        <p className="mb-3 font-fun font-extrabold text-ink">{tr('nav_languages')}</p>
        <LanguageSelector value={lang} onChange={setLang} />
      </section>

      <section className="mb-8 flex items-center justify-between rounded-xl2 bg-white p-5 shadow-card card-outline">
        <p className="font-fun font-extrabold text-ink">{tr('settings_sound')}</p>
        <button
          onClick={toggleSound}
          className={`grid h-12 w-12 place-items-center rounded-full text-2xl shadow-card btn-pressable ${
            progress.soundOn ? 'bg-grass-200' : 'bg-ink/10'
          }`}
        >
          {progress.soundOn ? '🔊' : '🔇'}
        </button>
      </section>

      <section className="rounded-xl2 bg-white p-5 shadow-card card-outline">
        <p className="mb-3 font-fun font-extrabold text-candy-600">{tr('settings_reset')}</p>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            className="rounded-full bg-candy-500 px-5 py-2.5 font-fun font-extrabold text-white shadow-card btn-pressable"
          >
            {tr('settings_reset')} 🗑️
          </button>
        ) : (
          <div className="space-y-3">
            <p className="text-sm font-bold text-ink/60">{tr('settings_reset_confirm')}</p>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  resetProgress()
                  setConfirming(false)
                }}
                className="rounded-full bg-candy-500 px-5 py-2.5 font-fun font-extrabold text-white shadow-card btn-pressable"
              >
                {tr('submit')}
              </button>
              <button onClick={() => setConfirming(false)} className="rounded-full bg-ink/10 px-5 py-2.5 font-fun font-extrabold text-ink btn-pressable">
                {tr('close')}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
