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

// The vocabulary academy is its own standalone area (dashboard, 6 levels,
// 6 game types, tests) rather than a single /play/:gameId game, so - like
// GTN - it gets a dedicated route and is code-split out of the main bundle.
const VocabAcademyPage = lazy(() => import('./vocab/VocabAcademyPage'))

function VocabAcademyLoading() {
  return (
    <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-24">
      <p className="font-fun font-extrabold text-ink/50">Loading...</p>
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
          <Route
            path="/games/vocab-academy"
            element={
              <Suspense fallback={<VocabAcademyLoading />}>
                <VocabAcademyPage />
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
