import { useCallback, useRef } from 'react'
import { useProgress } from './useProgress'

type SoundName = 'correct' | 'wrong' | 'click' | 'success' | 'levelup'

let sharedCtx: AudioContext | null = null
function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  const AC = window.AudioContext || (window as any).webkitAudioContext
  if (!AC) return null
  if (!sharedCtx) sharedCtx = new AC()
  return sharedCtx
}

function playTone(ctx: AudioContext, freq: number, start: number, duration: number, type: OscillatorType = 'sine', gainPeak = 0.15) {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = type
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0, ctx.currentTime + start)
  gain.gain.linearRampToValueAtTime(gainPeak, ctx.currentTime + start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + start + duration)
  osc.connect(gain)
  gain.connect(ctx.destination)
  osc.start(ctx.currentTime + start)
  osc.stop(ctx.currentTime + start + duration + 0.02)
}

const PATTERNS: Record<SoundName, (ctx: AudioContext) => void> = {
  correct: (ctx) => {
    playTone(ctx, 523.25, 0, 0.12)
    playTone(ctx, 783.99, 0.1, 0.16)
  },
  wrong: (ctx) => {
    playTone(ctx, 220, 0, 0.18, 'triangle', 0.12)
    playTone(ctx, 180, 0.12, 0.2, 'triangle', 0.1)
  },
  click: (ctx) => {
    playTone(ctx, 440, 0, 0.06, 'square', 0.06)
  },
  success: (ctx) => {
    ;[523.25, 659.25, 783.99, 1046.5].forEach((f, i) => playTone(ctx, f, i * 0.11, 0.18))
  },
  levelup: (ctx) => {
    ;[392, 523.25, 659.25, 783.99, 1046.5].forEach((f, i) => playTone(ctx, f, i * 0.09, 0.2))
  },
}

export function useSound() {
  const { progress } = useProgress()
  const unlockedRef = useRef(false)

  const play = useCallback(
    (name: SoundName) => {
      if (!progress.soundOn) return
      const ctx = getCtx()
      if (!ctx) return
      if (!unlockedRef.current) {
        ctx.resume?.()
        unlockedRef.current = true
      }
      try {
        PATTERNS[name](ctx)
      } catch {
        // audio not available in this environment - fail silently
      }
    },
    [progress.soundOn]
  )

  return { play }
}
