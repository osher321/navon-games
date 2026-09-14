/** Shared touch D-pad for held-direction movement games (maze_escape,
    money_grab). Pointer-capture-based like MazeGame's own inline dpad, so a
    slight finger shift never hands the touch stream to page scrolling. */
type Dir = [number, number]

interface DPadProps {
  onPress: (dir: Dir) => void
  onRelease: (dir: Dir) => void
}

export default function DPad({ onPress, onRelease }: DPadProps) {
  const btn = (dir: Dir, icon: string) => (
    <button
      onPointerDown={(e) => {
        e.preventDefault()
        e.currentTarget.setPointerCapture?.(e.pointerId)
        onPress(dir)
      }}
      onPointerUp={() => onRelease(dir)}
      onPointerCancel={() => onRelease(dir)}
      className="grid h-12 w-12 touch-none place-items-center rounded-2xl bg-white text-xl shadow-card btn-pressable active:scale-90"
      aria-label={icon}
    >
      {icon}
    </button>
  )

  return (
    <div
      className="fixed inset-x-0 z-30 flex touch-none items-center justify-center md:static md:z-auto md:mt-4 md:touch-auto"
      style={{ bottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
    >
      <div
        dir="ltr"
        className="grid touch-none grid-cols-3 grid-rows-3 gap-1 rounded-3xl bg-white/60 p-1.5 shadow-card backdrop-blur-sm md:touch-auto md:bg-transparent md:p-0 md:shadow-none md:backdrop-blur-0"
      >
        <div />
        {btn([-1, 0], '⬆️')}
        <div />
        {btn([0, -1], '⬅️')}
        <div />
        {btn([0, 1], '➡️')}
        <div />
        {btn([1, 0], '⬇️')}
        <div />
      </div>
    </div>
  )
}
