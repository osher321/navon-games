import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'

interface SecondaryAction {
  label: string
  onDown: () => void
  onUp: () => void
}

interface TapAction {
  label: string
  onTap: () => void
}

interface TouchControlsProps {
  onMove: (x: number, y: number) => void
  onJoystickRelease: () => void
  onJumpDown: () => void
  onJumpUp: () => void
  hideJump?: boolean
  /** Overrides the primary button's label - e.g. "⬆️" when it's repurposed as "climb" while flying. */
  jumpLabel?: string
  /** A second held-button stacked above the primary one - e.g. "⬇️" dive, only shown while piloting an air vehicle. */
  secondaryAction?: SecondaryAction | null
  /** On-foot only, mutually exclusive with secondaryAction (never both at once): a tap to equip/holster the weapon, stacked at the same slot secondaryAction would use. */
  weaponAction?: TapAction | null
  /** On-foot only: a held button to fire, stacked one slot above weaponAction. */
  fireAction?: SecondaryAction | null
}

const BASE_RADIUS = 52

export default function TouchControls({
  onMove,
  onJoystickRelease,
  onJumpDown,
  onJumpUp,
  hideJump,
  jumpLabel,
  secondaryAction,
  weaponAction,
  fireAction,
}: TouchControlsProps) {
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
          {jumpLabel ?? 'JUMP'}
        </button>
      )}

      {secondaryAction && (
        <button
          onPointerDown={(e) => {
            e.preventDefault()
            secondaryAction.onDown()
          }}
          onPointerUp={secondaryAction.onUp}
          onPointerCancel={secondaryAction.onUp}
          onPointerLeave={secondaryAction.onUp}
          className="absolute bottom-28 right-6 z-10 grid h-16 w-16 touch-none place-items-center rounded-full bg-white/80 font-fun text-sm font-extrabold text-ink shadow-card active:scale-90"
        >
          {secondaryAction.label}
        </button>
      )}

      {weaponAction && (
        <button
          onPointerDown={(e) => {
            e.preventDefault()
            weaponAction.onTap()
          }}
          className="absolute bottom-28 right-6 z-10 grid h-16 w-16 touch-none place-items-center rounded-full bg-white/80 font-fun text-2xl shadow-card active:scale-90"
        >
          {weaponAction.label}
        </button>
      )}

      {fireAction && (
        <button
          onPointerDown={(e) => {
            e.preventDefault()
            fireAction.onDown()
          }}
          onPointerUp={fireAction.onUp}
          onPointerCancel={fireAction.onUp}
          onPointerLeave={fireAction.onUp}
          className="absolute bottom-48 right-6 z-10 grid h-16 w-16 touch-none place-items-center rounded-full bg-candy-500/90 font-fun text-2xl shadow-card active:scale-90"
        >
          {fireAction.label}
        </button>
      )}
    </>
  )
}
