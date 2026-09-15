import { useState } from 'react'
import { useI18n } from '../i18n/LanguageContext'
import { useProgress } from '../hooks/useProgress'
import LanguageSelector from '../components/LanguageSelector'
import UiLanguageSelector from '../components/UiLanguageSelector'

export default function Settings() {
  const { tr } = useI18n()
  const { progress, setSelectedLanguage, toggleSound, resetProgress } = useProgress()
  const [confirming, setConfirming] = useState(false)

  return (
    <div className="mx-auto max-w-lg px-4 py-8 pb-24">
      <h1 className="mb-8 text-center font-fun text-3xl font-extrabold text-grape-600">{tr('settings_title')}</h1>

      <section className="mb-8 rounded-xl2 bg-white p-5 shadow-card card-outline">
        <p className="mb-3 font-fun font-extrabold text-ink">{tr('nav_languages')}</p>
        {/* Which language to LEARN - independent of the site's interface language below, so this binds directly to selectedLanguage, same as Home and the Languages hub. */}
        <LanguageSelector value={progress.selectedLanguage} onChange={setSelectedLanguage} />
      </section>

      <section className="mb-8 rounded-xl2 bg-white p-5 shadow-card card-outline">
        <p className="mb-3 font-fun font-extrabold text-ink">{tr('ui_lang_picker_title')}</p>
        <UiLanguageSelector />
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
