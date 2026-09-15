import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import GamesHub from './pages/GamesHub'
import LearningGamesPage from './pages/LearningGamesPage'
import LearningSubcategoryPage from './pages/LearningSubcategoryPage'
import LanguagesHub from './pages/LanguagesHub'
import GameScreen from './pages/GameScreen'
import Profile from './pages/Profile'
import Achievements from './pages/Achievements'
import ParentDashboard from './pages/ParentDashboard'
import Settings from './pages/Settings'

// The stories feature (30 stories' full text + two large per-language word
// dictionaries) is real weight that a visitor to the home page, GamesHub,
// or any other unrelated route should never have to download - same
// reasoning as GTN and the vocab academy below, so it gets the same
// code-split + Suspense treatment instead of a static import.
const StoriesHubPage = lazy(() => import('./pages/StoriesHubPage'))
const StoriesListPage = lazy(() => import('./pages/StoriesListPage'))
const StoryReaderPage = lazy(() => import('./pages/StoryReaderPage'))

function StoriesLoading() {
  return (
    <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-24">
      <p className="font-fun font-extrabold text-ink/50">Loading…</p>
    </div>
  )
}

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

// The Daily Challenge's question generator + 3 question-UI components are
// only needed by visitors who actually open the challenge, so - like
// stories/GTN/vocab academy above - it's code-split out of the main bundle.
const DailyChallengePage = lazy(() => import('./pages/DailyChallengePage'))

function DailyChallengeLoading() {
  return (
    <div className="mx-auto flex max-w-4xl items-center justify-center px-4 py-24">
      <p className="font-fun font-extrabold text-ink/50">Loading…</p>
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
          {/* /games is the 🎮 "משחקים בשביל הכיף" page. /games/learning is
              the 📚 "משחקים בשביל ללמוד" hub, with /games/learning/math and
              /games/learning/logic as its two non-language sub-areas
              (🌍 לומדים שפות links out to the existing /learn-languages hub
              instead of duplicating it here). */}
          <Route path="/games" element={<GamesHub />} />
          <Route path="/games/learning" element={<LearningGamesPage />} />
          <Route path="/games/learning/:subcategory" element={<LearningSubcategoryPage />} />
          {/* /games/math is the clean, canonical URL for the addition/
              subtraction game (the SEO-focused entry point); /play/:gameId
              still works for every game including this one, unchanged. */}
          <Route path="/games/math" element={<GameScreen forcedGameId="math_addition_subtraction" />} />
          <Route path="/learn-languages" element={<LanguagesHub />} />
          <Route
            path="/learn-languages/stories"
            element={
              <Suspense fallback={<StoriesLoading />}>
                <StoriesHubPage />
              </Suspense>
            }
          />
          <Route
            path="/learn-languages/stories/:langSlug"
            element={
              <Suspense fallback={<StoriesLoading />}>
                <StoriesListPage />
              </Suspense>
            }
          />
          <Route
            path="/learn-languages/stories/:langSlug/:storyId"
            element={
              <Suspense fallback={<StoriesLoading />}>
                <StoryReaderPage />
              </Suspense>
            }
          />
          <Route
            path="/learn-languages/daily-challenge"
            element={
              <Suspense fallback={<DailyChallengeLoading />}>
                <DailyChallengePage />
              </Suspense>
            }
          />
          <Route path="/learn-languages/:langSlug" element={<LanguagesHub />} />
          {/* Old hash-router-era path, kept as a redirect so any existing
              bookmarks/links still land on a real page instead of a 404. */}
          <Route path="/languages" element={<Navigate to="/learn-languages" replace />} />
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
