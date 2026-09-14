import type { FunGameProps } from '../../games/types'
import EndlessRunnerEngine, { type RunnerConfig } from './EndlessRunnerEngine'

const CONFIG: RunnerConfig = {
  title: "🥷 נינג'ה ראנר",
  characterPalette: { jacket: 0x1c1c24, jacketShade: 0x101014, pants: 0x151519, shoes: 0x2a2a2f, skin: 0xe6b98c, hair: 0x111111 },
  themes: [
    { skyColor: 0x7fbf6f, fogColor: 0x9fd68f, groundColor: 0x3f7a3f, obstacleColor: 0x6b4a2f, label: '🌲 יער' },
    { skyColor: 0xe8b25f, fogColor: 0xf0c987, groundColor: 0x8a6a3f, obstacleColor: 0x7a3f2f, label: '🏯 כפר נינג׳ות' },
    { skyColor: 0x9fb6cf, fogColor: 0xc2d3e3, groundColor: 0x7a828f, obstacleColor: 0x4a4f5a, label: '🏔️ הר' },
    { skyColor: 0x3f2530, fogColor: 0x6b2f3a, groundColor: 0x2a1a1f, obstacleColor: 0xaf2f2f, label: '🌋 אזור מסוכן' },
  ],
  themeDistanceStep: 220,
  combatEnabled: true,
  doubleJump: true,
}

export default function NinjaRunnerGame({ onFinish }: FunGameProps) {
  return <EndlessRunnerEngine config={CONFIG} onFinish={onFinish} />
}
