import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import { motion } from 'framer-motion'
import { useI18n } from '../../i18n/LanguageContext'
import { useArcadeCanvas } from '../../arcade3d/useArcadeCanvas'
import { setupBasicLighting, disposeObject3D } from '../../arcade3d/sceneBasics'
import { CHARACTERS } from '../game/characters/roster'
import { buildCharacter } from '../game/characters/build'
import { animateHumanoid, HIP_HEIGHT, TORSO_HEIGHT } from '../game/humanoid'
import type { HumanoidParts } from '../game/humanoid'

interface CharacterSelectProps {
  initialId: string
  onDone: (id: string) => void
  onBack: () => void
}

/**
 * A single shared preview canvas (not one WebGL context per card) that
 * swaps in whichever character is currently highlighted - only ever one
 * full character model lives in memory here, matching the "don't load all
 * 10 at once" performance requirement. The 20 cards themselves are plain
 * 2D UI (emoji + name), not live 3D viewports.
 */
export default function CharacterSelect({ initialId, onDone, onBack }: CharacterSelectProps) {
  const { tr } = useI18n()
  const mountRef = useRef<HTMLDivElement>(null)
  const [highlightedId, setHighlightedId] = useState(initialId)

  const stateRef = useRef<{ parts: HumanoidParts | null; camera: THREE.PerspectiveCamera | null; phase: number; yaw: number; autoSpin: boolean }>({
    parts: null,
    camera: null,
    phase: 0,
    yaw: 0.3,
    autoSpin: true,
  })
  const builtIdRef = useRef<string | null>(null)

  useArcadeCanvas(
    mountRef,
    (dt, { scene, renderer, mount }) => {
      const st = stateRef.current
      if (!st.camera) {
        const camera = new THREE.PerspectiveCamera(40, mount.clientWidth / mount.clientHeight, 0.1, 20)
        const focusY = HIP_HEIGHT + TORSO_HEIGHT * 0.75
        camera.position.set(0, focusY, 2.5)
        camera.lookAt(0, focusY, 0)
        st.camera = camera
        setupBasicLighting(scene, 0xdbe9ff, 0xdbe9ff, 0)
        scene.background = new THREE.Color(0x232042)
      }

      if (builtIdRef.current !== highlightedId) {
        if (st.parts) {
          scene.remove(st.parts.root)
          disposeObject3D(st.parts.root)
        }
        const def = CHARACTERS.find((c) => c.id === highlightedId) ?? CHARACTERS[0]
        const parts = buildCharacter(def)
        parts.root.rotation.y = st.yaw
        scene.add(parts.root)
        st.parts = parts
        builtIdRef.current = highlightedId
      }

      if (st.parts) {
        if (st.autoSpin) st.yaw += dt * 0.35
        st.parts.root.rotation.y = st.yaw
        st.phase += dt * 6
        animateHumanoid(st.parts, st.phase, 0, dt)
      }

      renderer.render(scene, st.camera)
    },
    ({ scene }) => {
      const st = stateRef.current
      if (st.parts) disposeObject3D(st.parts.root)
      scene.clear()
      st.parts = null
      st.camera = null
      builtIdRef.current = null
    },
    false
  )

  // Drag-to-rotate 360° - pauses auto-spin while actively dragging, resumes after release.
  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return
    let dragId: number | null = null
    let lastX = 0
    const onDown = (e: PointerEvent) => {
      if (dragId !== null) return
      dragId = e.pointerId
      lastX = e.clientX
      stateRef.current.autoSpin = false
    }
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== dragId) return
      const dx = e.clientX - lastX
      lastX = e.clientX
      stateRef.current.yaw += dx * 0.012
    }
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== dragId) return
      dragId = null
    }
    mount.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      mount.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  const highlighted = CHARACTERS.find((c) => c.id === highlightedId) ?? CHARACTERS[0]
  const girls = CHARACTERS.filter((c) => c.groupStyle === 'girl')
  const boys = CHARACTERS.filter((c) => c.groupStyle === 'boy')

  const renderGroup = (label: string, list: typeof CHARACTERS) => (
    <div className="mb-4">
      <p className="mb-2 text-center text-xs font-bold text-white/60">{label}</p>
      <div className="grid grid-cols-5 gap-2">
        {list.map((c) => {
          const selected = c.id === highlightedId
          return (
            <button
              key={c.id}
              onClick={() => setHighlightedId(c.id)}
              aria-pressed={selected}
              aria-label={`${tr('gtn_character_select_pick')} ${c.name}`}
              className={`flex flex-col items-center gap-1 rounded-xl2 px-1 py-2 font-fun text-white shadow-card btn-pressable transition-all ${
                selected ? 'bg-gradient-to-br from-sunny-400 to-candy-500 ring-2 ring-white' : 'bg-white/10 hover:bg-white/20'
              }`}
            >
              <span className="text-xl">{c.emoji}</span>
              <span className="text-[10px] font-extrabold leading-tight">{c.name}</span>
              {selected && <span aria-hidden="true">✅</span>}
            </button>
          )
        })}
      </div>
    </div>
  )

  return (
    <div className="relative flex min-h-[70vh] flex-col overflow-hidden rounded-blob bg-gradient-to-br from-ink via-grape-700 to-candy-700 p-4 text-white shadow-pop sm:min-h-[75vh] sm:p-6">
      <div className="mb-3 flex items-center justify-between">
        <button onClick={onBack} className="rounded-full bg-white/15 px-4 py-2 font-fun text-sm font-extrabold btn-pressable">
          ← BACK
        </button>
        <h2 className="text-center font-fun text-lg font-extrabold sm:text-xl">🎮 {tr('gtn_character_select_title')}</h2>
        <div className="w-[70px]" />
      </div>
      <p className="mb-3 text-center text-xs text-white/60">{tr('gtn_character_select_subtitle')}</p>

      <div className="grid flex-1 gap-4 sm:grid-cols-[minmax(0,1fr)_260px]">
        <div className="relative overflow-hidden rounded-xl2 shadow-card" style={{ minHeight: 260 }}>
          <div ref={mountRef} className="h-full min-h-[260px] w-full touch-none" />
          <div className="pointer-events-none absolute inset-x-0 bottom-2 flex flex-col items-center gap-1">
            <span className="rounded-full bg-black/40 px-3 py-1 text-xs font-bold">
              {highlighted.emoji} {highlighted.name} · {highlighted.tagline}
            </span>
            <span className="rounded-full bg-black/30 px-3 py-1 text-[10px] font-bold text-white/80">🔄 {tr('gtn_character_rotate_hint')}</span>
          </div>
        </div>

        <div className="flex flex-col justify-center">
          {renderGroup(`👧 ${tr('gtn_character_group_label')}`, girls)}
          {renderGroup(`👦 ${tr('gtn_character_group_label')}`, boys)}
        </div>
      </div>

      <motion.button
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => onDone(highlightedId)}
        className="mx-auto mt-4 rounded-full bg-gradient-to-r from-sunny-400 to-candy-500 px-8 py-4 font-fun text-lg font-extrabold text-ink shadow-pop btn-pressable"
      >
        🚀 {tr('gtn_character_start_cta')} {highlighted.name}
      </motion.button>
    </div>
  )
}
