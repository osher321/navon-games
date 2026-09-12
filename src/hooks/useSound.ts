import { useCallback, useRef } from 'react'
import { useProgress } from './useProgress'

type SoundName = 'correct' | 'wrong' | 'click' | 'success' | 'levelup' | 'pop' | 'coin' | 'hit' | 'shield'

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
  pop: (ctx) => {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const now = ctx.currentTime
    osc.type = 'sine'
    osc.frequency.setValueAtTime(950, now)
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.09)
    gain.gain.setValueAtTime(0.001, now)
    gain.gain.exponentialRampToValueAtTime(0.2, now + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.11)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.13)
  },
  coin: (ctx) => {
    playTone(ctx, 1046.5, 0, 0.07, 'sine', 0.13)
    playTone(ctx, 1568, 0.05, 0.09, 'sine', 0.11)
  },
  hit: (ctx) => {
    playTone(ctx, 160, 0, 0.16, 'sawtooth', 0.15)
    playTone(ctx, 110, 0.05, 0.18, 'sawtooth', 0.12)
  },
  shield: (ctx) => {
    playTone(ctx, 660, 0, 0.1, 'triangle', 0.12)
    playTone(ctx, 990, 0.08, 0.16, 'triangle', 0.12)
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
