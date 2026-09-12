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
  private interactQueued = false
  private climbButtonDown = false
  private diveButtonDown = false
  private weaponToggleQueued = false
  private reloadQueued = false
  private fireHeld = false
  private fireCleanup: (() => void) | null = null

  private onKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase()
    if (!this.keys.has(key) && key === 'e') this.interactQueued = true
    if (!this.keys.has(key) && key === 'f') this.weaponToggleQueued = true
    if (!this.keys.has(key) && key === 'r') this.reloadQueued = true
    this.keys.add(key)
    if (e.key === ' ' || e.key === 'Spacebar') this.jumpQueued = true
  }
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.key.toLowerCase())
  }

  constructor() {
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  /** Wires left-mouse-button-held to firing, scoped to the game canvas itself (not the whole window) so clicking HUD/menu buttons on top of it never triggers a shot. */
  bindFireElement(el: HTMLElement) {
    const down = (e: MouseEvent) => {
      if (e.button === 0) this.fireHeld = true
    }
    const up = () => {
      this.fireHeld = false
    }
    el.addEventListener('mousedown', down)
    // Released on the window, not just the canvas, so dragging the mouse
    // off the viewport before releasing doesn't leave firing stuck on.
    window.addEventListener('mouseup', up)
    this.fireCleanup = () => {
      el.removeEventListener('mousedown', down)
      window.removeEventListener('mouseup', up)
    }
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

  setClimbButtonDown(down: boolean) {
    this.climbButtonDown = down
  }

  setDiveButtonDown(down: boolean) {
    this.diveButtonDown = down
  }

  /** Flight controls only: hold Space (or the mobile "climb" button) to gain altitude. */
  isClimbHeld(): boolean {
    return this.climbButtonDown || this.keys.has(' ')
  }

  /** Flight controls only: hold Shift (or the mobile "dive" button) to lose altitude. */
  isDiveHeld(): boolean {
    return this.diveButtonDown || this.keys.has('shift')
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

  /** Hold Shift on desktop, or push the joystick close to full tilt on mobile, to run. */
  isRunning(): boolean {
    if (this.joystickActive) return Math.hypot(this.joystick.x, this.joystick.y) > 0.78
    return this.keys.has('shift')
  }

  /** Returns true once per jump request, then resets. */
  consumeJump(): boolean {
    if (this.jumpQueued) {
      this.jumpQueued = false
      return true
    }
    return false
  }

  /** Call from a mobile "Enter/Exit vehicle" button - same edge-triggered queue as the E key. */
  queueInteract() {
    this.interactQueued = true
  }

  /** Returns true once per mount/dismount request, then resets. */
  consumeInteract(): boolean {
    if (this.interactQueued) {
      this.interactQueued = false
      return true
    }
    return false
  }

  /** Call from a mobile weapon-toggle button - same edge-triggered queue as the F key. */
  queueWeaponToggle() {
    this.weaponToggleQueued = true
  }

  /** Returns true once per equip/holster request, then resets. */
  consumeWeaponToggle(): boolean {
    if (this.weaponToggleQueued) {
      this.weaponToggleQueued = false
      return true
    }
    return false
  }

  /** Returns true once per manual reload request, then resets. Mobile has no dedicated reload button (the weapon auto-reloads on empty), so this is desktop-only. */
  consumeReload(): boolean {
    if (this.reloadQueued) {
      this.reloadQueued = false
      return true
    }
    return false
  }

  /** Mobile fire button - held state, same idea as the climb/dive buttons. */
  setFireButtonDown(down: boolean) {
    this.fireHeld = down
  }

  isFireHeld(): boolean {
    return this.fireHeld
  }

  dispose() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    this.fireCleanup?.()
  }
}
