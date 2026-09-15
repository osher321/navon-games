import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/LanguageContext'
import { useProgress } from '../hooks/useProgress'
import MainMenu from './ui/MainMenu'
import InfoPanel from './ui/InfoPanel'
import CharacterSelect from './ui/CharacterSelect'
import GameCanvas from './game/GameCanvas'
import { DEFAULT_CHARACTER_ID } from './game/characters/roster'
import Breadcrumbs from '../components/Breadcrumbs'
import SEOHead from '../seo/SEOHead'

type Phase = 'menu' | 'characterSelect' | 'playing' | 'missions' | 'howto' | 'settings'

export default function GTNPage() {
  const { tr } = useI18n()
  const navigate = useNavigate()
  const { progress, setGtnCharacter } = useProgress()
  const [phase, setPhase] = useState<Phase>('menu')

  // First-ever visit: no character chosen yet - send Play straight to
  // Character Selection instead of dropping them into the world with a
  // default they never picked. Every later Play (or the menu's own
  // "CHARACTER" button) can still change it at any time.
  const handlePlay = () => {
    setPhase(progress.gtnSelectedCharacterId ? 'playing' : 'characterSelect')
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24">
      <SEOHead
        title="GTN - Grand Theft Neighborhood | משחק עולם פתוח בדפדפן | נבון משחקים"
        description="שחקו ב-GTN - משחק עולם פתוח בתלת-ממד בדפדפן: נהיגה, טיסה, שיט והליכה בעיר פתוחה, בחינם וללא הורדה."
        path="/games/gtn"
      />
      {phase === 'menu' && <Breadcrumbs items={[{ label: tr('nav_home'), href: '/' }, { label: tr('cat_fun_games'), href: '/games' }, { label: 'GTN' }]} />}
      {phase === 'menu' && (
        <MainMenu
          onPlay={handlePlay}
          onCharacter={() => setPhase('characterSelect')}
          onMissions={() => setPhase('missions')}
          onHowToPlay={() => setPhase('howto')}
          onSettings={() => setPhase('settings')}
          onBack={() => navigate('/games')}
        />
      )}

      {phase === 'characterSelect' && (
        <CharacterSelect
          initialId={progress.gtnSelectedCharacterId ?? DEFAULT_CHARACTER_ID}
          onDone={(id) => {
            setGtnCharacter(id)
            setPhase('playing')
          }}
          onBack={() => setPhase('menu')}
        />
      )}

      {phase === 'playing' && <GameCanvas onExit={() => setPhase('menu')} characterId={progress.gtnSelectedCharacterId ?? DEFAULT_CHARACTER_ID} />}

      {phase === 'missions' && (
        <InfoPanel title="🎯 MISSIONS" onClose={() => setPhase('menu')}>
          <p>{tr('gtn_coming_soon')}</p>
        </InfoPanel>
      )}

      {phase === 'howto' && (
        <InfoPanel title="❓ HOW TO PLAY" onClose={() => setPhase('menu')}>
          <p>🕹️ {tr('gtn_howto_move')}</p>
          <p>🦘 {tr('gtn_howto_jump')}</p>
          <p>📱 {tr('gtn_howto_mobile')}</p>
          <p className="mt-3 font-extrabold">🔫 {tr('gtn_howto_weapon_title')}</p>
          <p>{tr('gtn_howto_weapon_equip')}</p>
          <p>{tr('gtn_howto_weapon_fire')}</p>
          <p>{tr('gtn_howto_weapon_aim')}</p>
          <p>{tr('gtn_howto_weapon_reload')}</p>
          <p>{tr('gtn_howto_weapon_mobile')}</p>
        </InfoPanel>
      )}

      {phase === 'settings' && (
        <InfoPanel title="⚙ SETTINGS" onClose={() => setPhase('menu')}>
          <p>{tr('gtn_coming_soon')}</p>
        </InfoPanel>
      )}
    </div>
  )
}
