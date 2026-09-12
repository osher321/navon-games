import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { buildCity, SPAWN_POINT } from './world'
import { Player } from './player'
import { ChaseCamera } from './camera'
import { GtnInput } from './input'
import TouchControls from '../ui/TouchControls'

interface GameCanvasProps {
  onExit: () => void
}

export default function GameCanvas({ onExit }: GameCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<GtnInput | null>(null)

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x9fd8ff)
    scene.fog = new THREE.Fog(0x9fd8ff, 30, 85)

    const hemi = new THREE.HemisphereLight(0xbfe3ff, 0x3a5f3a, 0.9)
    scene.add(hemi)

    const sun = new THREE.DirectionalLight(0xfff3d6, 1.2)
    sun.position.set(24, 32, 12)
    sun.castShadow = true
    sun.shadow.mapSize.set(1024, 1024)
    sun.shadow.camera.left = -40
    sun.shadow.camera.right = 40
    sun.shadow.camera.top = 40
    sun.shadow.camera.bottom = -40
    sun.shadow.camera.far = 90
    scene.add(sun)

    scene.add(buildCity())

    const player = new Player()
    player.position.copy(SPAWN_POINT)
    scene.add(player.root)

    const chaseCamera = new ChaseCamera(mount.clientWidth / mount.clientHeight)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.shadowMap.enabled = true
    mount.appendChild(renderer.domElement)

    const input = new GtnInput()
    inputRef.current = input

    const resize = () => {
      if (!mount) return
      renderer.setSize(mount.clientWidth, mount.clientHeight)
      chaseCamera.setAspect(mount.clientWidth / mount.clientHeight)
    }
    window.addEventListener('resize', resize)
    const resizeObserver = new ResizeObserver(resize)
    resizeObserver.observe(mount)

    let raf = 0
    let last = performance.now()
    const loop = () => {
      raf = requestAnimationFrame(loop)
      const now = performance.now()
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now

      const move = input.getMove()
      player.update(dt, move.x, move.y, input.consumeJump())
      chaseCamera.update(dt, player.position, player.facing)

      renderer.render(scene, chaseCamera.camera)
    }
    loop()

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      resizeObserver.disconnect()
      input.dispose()
      inputRef.current = null
      renderer.dispose()
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose())
          else obj.material.dispose()
        }
      })
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
  }, [])

  return (
    <div className="relative h-[70vh] w-full overflow-hidden rounded-blob bg-ink shadow-pop sm:h-[75vh]">
      <div ref={mountRef} className="absolute inset-0" />

      <button
        onClick={onExit}
        className="absolute right-3 top-3 z-10 rounded-full bg-white/90 px-4 py-2 font-fun text-sm font-extrabold text-ink shadow-card btn-pressable"
      >
        ✕ Exit
      </button>

      <TouchControls
        onMove={(x, y) => {
          inputRef.current?.setJoystickActive(x !== 0 || y !== 0)
          inputRef.current?.setJoystick(x, y)
        }}
        onJoystickRelease={() => inputRef.current?.setJoystickActive(false)}
        onJumpDown={() => inputRef.current?.setJumpButtonDown(true)}
        onJumpUp={() => inputRef.current?.setJumpButtonDown(false)}
      />
    </div>
  )
}
