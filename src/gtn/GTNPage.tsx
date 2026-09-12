import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/LanguageContext'
import MainMenu from './ui/MainMenu'
import InfoPanel from './ui/InfoPanel'
import GameCanvas from './game/GameCanvas'

type Phase = 'menu' | 'playing' | 'missions' | 'howto' | 'settings'

export default function GTNPage() {
  const { tr } = useI18n()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<Phase>('menu')

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 pb-24">
      {phase === 'menu' && (
        <MainMenu
          onPlay={() => setPhase('playing')}
          onMissions={() => setPhase('missions')}
          onHowToPlay={() => setPhase('howto')}
          onSettings={() => setPhase('settings')}
          onBack={() => navigate('/games')}
        />
      )}

      {phase === 'playing' && <GameCanvas onExit={() => setPhase('menu')} />}

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
