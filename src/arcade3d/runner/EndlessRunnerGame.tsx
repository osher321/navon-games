import type { FunGameProps } from '../../games/types'
import EndlessRunnerEngine, { type RunnerConfig } from './EndlessRunnerEngine'

const CONFIG: RunnerConfig = {
  title: '🏃 ריצה אינסופית',
  characterPalette: {},
  themes: [{ skyColor: 0x9fd9ff, fogColor: 0xbfe8ff, groundColor: 0x6fae4f, obstacleColor: 0xd6552f, label: 'מסלול' }],
  themeDistanceStep: 100000,
  combatEnabled: false,
  doubleJump: false,
}

export default function EndlessRunnerGame({ onFinish }: FunGameProps) {
  return <EndlessRunnerEngine config={CONFIG} onFinish={onFinish} />
}
