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
