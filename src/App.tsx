import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import GamesHub from './pages/GamesHub'
import LanguagesHub from './pages/LanguagesHub'
import GameScreen from './pages/GameScreen'
import Profile from './pages/Profile'
import Achievements from './pages/Achievements'
import ParentDashboard from './pages/ParentDashboard'
import Settings from './pages/Settings'

// GTN is a large, self-contained 3D game (Three.js). It is code-split and
// only fetched when the user actually opens /games/gtn, so it never adds
// weight to the home page or any other route.
const GTNPage = lazy(() => import('./gtn/GTNPage'))

function GTNLoading() {
  return (
    <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-24">
      <p className="font-fun font-extrabold text-ink/50">Loading GTN…</p>
    </div>
  )
}

export default function App() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/games" element={<GamesHub />} />
          <Route path="/languages" element={<LanguagesHub />} />
          <Route path="/play/:gameId" element={<GameScreen />} />
          <Route
            path="/games/gtn"
            element={
              <Suspense fallback={<GTNLoading />}>
                <GTNPage />
              </Suspense>
            }
          />
          <Route path="/profile" element={<Profile />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/parents" element={<ParentDashboard />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </div>
  )
}
