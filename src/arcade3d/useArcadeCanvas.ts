import { useEffect, useRef, type RefObject } from 'react'
import * as THREE from 'three'

export interface ArcadeCanvasHandle {
  scene: THREE.Scene
  renderer: THREE.WebGLRenderer
  mount: HTMLDivElement
}

/**
 * Shared Three.js mount/resize/render-loop lifecycle - the same renderer
 * setup and RAF-with-clamped-dt pattern GTN's GameCanvas already uses,
 * extracted so every arcade game reuses it instead of hand-rolling the
 * same ~25 lines again. The caller owns everything game-specific (camera,
 * scene contents, and issuing the actual `renderer.render(...)` call) via
 * `onFrame`; this hook only owns the canvas element, resize wiring, and
 * timing - and skips calling `onFrame` while `paused` is true, which is
 * enough to freeze a game without tearing down and rebuilding the scene.
 */
export function useArcadeCanvas(
  mountRef: RefObject<HTMLDivElement | null>,
  onFrame: (dt: number, handle: ArcadeCanvasHandle) => void,
  onDispose: (handle: ArcadeCanvasHandle) => void,
  paused: boolean
) {
  const pausedRef = useRef(paused)
  useEffect(() => {
    pausedRef.current = paused
  }, [paused])

  const onFrameRef = useRef(onFrame)
  onFrameRef.current = onFrame
  const onDisposeRef = useRef(onDispose)
  onDisposeRef.current = onDispose

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    const scene = new THREE.Scene()
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth, mount.clientHeight)
    renderer.shadowMap.enabled = true
    mount.appendChild(renderer.domElement)

    const handle: ArcadeCanvasHandle = { scene, renderer, mount }

    const resize = () => {
      renderer.setSize(mount.clientWidth, mount.clientHeight)
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
      if (!pausedRef.current) onFrameRef.current(dt, handle)
    }
    raf = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
      resizeObserver.disconnect()
      onDisposeRef.current(handle)
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}
