import { NavLink } from 'react-router-dom'
import { useI18n } from '../i18n/LanguageContext'
import { useProgress } from '../hooks/useProgress'

const NAV_ITEMS = [
  { to: '/', key: 'nav_home', icon: '🏠' },
  { to: '/games', key: 'nav_games', icon: '🎮' },
  { to: '/languages', key: 'nav_languages', icon: '📚' },
  { to: '/profile', key: 'nav_profile', icon: '👦' },
  { to: '/parents', key: 'nav_parents', icon: '👨‍👩‍👧' },
]

export default function Navbar() {
  const { tr } = useI18n()
  const { progress, toggleSound } = useProgress()

  return (
    <>
      <header className="sticky top-0 z-40 border-b-4 border-white/70 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <NavLink to="/" className="flex items-center gap-2 font-fun text-xl font-extrabold text-grape-600 sm:text-2xl">
            <span className="text-3xl animate-floaty">🎮</span>
            <span>{tr('siteName')}</span>
          </NavLink>

          <nav className="hidden items-center gap-1 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-1 rounded-full px-4 py-2 font-fun text-sm font-bold transition-colors ${
                    isActive ? 'bg-grape-500 text-white shadow-card' : 'text-ink/70 hover:bg-grape-100'
                  }`
                }
              >
                <span>{item.icon}</span>
                <span>{tr(item.key)}</span>
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-full bg-sunny-100 px-3 py-1.5 font-fun font-extrabold text-sunny-600 shadow-card">
              <span>⭐</span>
              <span>{progress.stars}</span>
            </div>
            <div className="hidden items-center gap-1 rounded-full bg-candy-100 px-3 py-1.5 font-fun font-extrabold text-candy-600 shadow-card sm:flex">
              <span>🔥</span>
              <span>{progress.streak}</span>
            </div>
            <button
              onClick={toggleSound}
              aria-label={tr('settings_sound')}
              className="grid h-9 w-9 place-items-center rounded-full bg-sky-100 text-lg text-sky-600 shadow-card btn-pressable"
            >
              {progress.soundOn ? '🔊' : '🔇'}
            </button>
            <NavLink
              to="/settings"
              aria-label={tr('nav_settings')}
              className="hidden h-9 w-9 place-items-center rounded-full bg-grape-100 text-lg text-grape-600 shadow-card btn-pressable sm:grid"
            >
              ⚙️
            </NavLink>
          </div>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex justify-around border-t-4 border-white/80 bg-white/95 py-1.5 backdrop-blur-md md:hidden">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-0.5 rounded-2xl px-3 py-1 text-[11px] font-fun font-bold transition-colors ${
                isActive ? 'text-grape-600' : 'text-ink/50'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span>{tr(item.key)}</span>
          </NavLink>
        ))}
      </nav>
    </>
  )
}
