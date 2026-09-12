import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

interface TouchControlsProps {
  onMove: (x: number, y: number) => void
  onJoystickRelease: () => void
  onJumpDown: () => void
  onJumpUp: () => void
  hideJump?: boolean
}

const BASE_RADIUS = 52

export default function TouchControls({ onMove, onJoystickRelease, onJumpDown, onJumpUp, hideJump }: TouchControlsProps) {
  const [isTouch, setIsTouch] = useState(false)
  const [knob, setKnob] = useState({ x: 0, y: 0 })
  const baseRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)

  useEffect(() => {
    setIsTouch(window.matchMedia('(pointer: coarse)').matches)
  }, [])

  if (!isTouch) return null

  const updateFromEvent = (e: ReactPointerEvent) => {
    const base = baseRef.current
    if (!base) return
    const rect = base.getBoundingClientRect()
    const cx = rect.left + rect.width / 2
    const cy = rect.top + rect.height / 2
    let dx = e.clientX - cx
    let dy = e.clientY - cy
    const dist = Math.hypot(dx, dy)
    if (dist > BASE_RADIUS) {
      dx = (dx / dist) * BASE_RADIUS
      dy = (dy / dist) * BASE_RADIUS
    }
    setKnob({ x: dx, y: dy })
    onMove(dx / BASE_RADIUS, -dy / BASE_RADIUS)
  }

  const endDrag = () => {
    draggingRef.current = false
    setKnob({ x: 0, y: 0 })
    onJoystickRelease()
  }

  return (
    <>
      <div
        ref={baseRef}
        onPointerDown={(e) => {
          draggingRef.current = true
          e.currentTarget.setPointerCapture?.(e.pointerId)
          updateFromEvent(e)
        }}
        onPointerMove={(e) => draggingRef.current && updateFromEvent(e)}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="absolute bottom-6 left-6 z-10 h-[104px] w-[104px] touch-none rounded-full bg-white/25 backdrop-blur-sm"
      >
        <div
          className="absolute left-1/2 top-1/2 h-12 w-12 rounded-full bg-white/80 shadow-card"
          style={{ transform: `translate(-50%, -50%) translate(${knob.x}px, ${knob.y}px)` }}
        />
      </div>

      {!hideJump && (
        <button
          onPointerDown={(e) => {
            e.preventDefault()
            onJumpDown()
          }}
          onPointerUp={onJumpUp}
          onPointerCancel={onJumpUp}
          onPointerLeave={onJumpUp}
          className="absolute bottom-8 right-6 z-10 grid h-16 w-16 touch-none place-items-center rounded-full bg-white/80 font-fun text-sm font-extrabold text-ink shadow-card active:scale-90"
        >
          JUMP
        </button>
      )}
    </>
  )
}
