/**
 * Reads keyboard + on-screen joystick/jump input into a single normalized
 * state that the render loop polls every frame. Deliberately not React
 * state - this updates far more often than a component should re-render.
 */
export class GtnInput {
  private keys = new Set<string>()
  private joystick = { x: 0, y: 0 }
  private joystickActive = false
  private jumpButtonDown = false
  private jumpQueued = false

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys.add(e.key.toLowerCase())
    if (e.key === ' ' || e.key === 'Spacebar') this.jumpQueued = true
  }
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase())
  }

  constructor() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  setJoystick(x: number, y: number) {
    this.joystick.x = x
    this.joystick.y = y
  }

  setJoystickActive(active: boolean) {
    this.joystickActive = active
    if (!active) {
      this.joystick.x = 0
      this.joystick.y = 0
    }
  }

  setJumpButtonDown(down: boolean) {
    if (down && !this.jumpButtonDown) this.jumpQueued = true
    this.jumpButtonDown = down
  }

  /** Normalized move vector: x = strafe (-1..1), y = forward (-1..1). */
  getMove(): { x: number; y: number } {
    if (this.joystickActive) return { ...this.joystick }
    let x = 0
    let y = 0
    if (this.keys.has('arrowup') || this.keys.has('w')) y += 1
    if (this.keys.has('arrowdown') || this.keys.has('s')) y -= 1
    if (this.keys.has('arrowleft') || this.keys.has('a')) x -= 1
    if (this.keys.has('arrowright') || this.keys.has('d')) x += 1
    const len = Math.hypot(x, y)
    if (len > 1) {
      x /= len
      y /= len
    }
    return { x, y }
  }

  /** Returns true once per jump request, then resets. */
  consumeJump(): boolean {
    if (this.jumpQueued) {
      this.jumpQueued = false
      return true
    }
    return false
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }
}
