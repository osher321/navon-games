import * as THREE from 'three'
import { BALL_RADIUS } from './types'

const GRAVITY = 9.8
const RESTITUTION = 0.46
const GROUND_FRICTION = 2.6
const AIR_DRAG = 0.06

/** A pentagon/hexagon ball pattern drawn once on a small canvas - cheap, original, not a photo texture. */
function buildBallTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#f4f6fa'
  ctx.fillRect(0, 0, 256, 256)
  ctx.fillStyle = '#181c24'
  const spots: [number, number, number][] = [
    [64, 64, 30],
    [192, 64, 30],
    [128, 150, 34],
    [40, 200, 26],
    [216, 200, 26],
  ]
  spots.forEach(([x, y, r]) => {
    ctx.beginPath()
    ctx.moveTo(x, y - r)
    for (let i = 1; i < 6; i++) {
      const ang = (i / 6) * Math.PI * 2 - Math.PI / 2
      ctx.lineTo(x + Math.cos(ang) * r, y + Math.sin(ang) * r)
    }
    ctx.closePath()
    ctx.fill()
  })
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

let sharedBallTexture: THREE.CanvasTexture | null = null

/**
 * A real physical ball - gravity, ground bounce/friction, air drag, and a
 * gentle mid-flight "curve" (a stand-in for spin/swerve) rather than a
 * sprite sliding along a fixed animation path. `update()` is pure state
 * advancement; callers decide what a bounce/stop/goal-line-crossing means
 * for their game mode.
 */
export class SoccerBall {
  readonly mesh: THREE.Mesh
  readonly velocity = new THREE.Vector3()
  /** Sideways acceleration applied while airborne - simulates the curl from the shot's spin without full aerodynamics. */
  curve = 0
  grounded = true
  private spinAxis = new THREE.Vector3(1, 0, 0)

  constructor() {
    if (!sharedBallTexture) sharedBallTexture = buildBallTexture()
    const mat = new THREE.MeshStandardMaterial({ map: sharedBallTexture, roughness: 0.5, metalness: 0.05 })
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(BALL_RADIUS, 20, 16), mat)
    this.mesh.castShadow = true
  }

  get position() {
    return this.mesh.position
  }

  placeAt(x: number, y: number, z: number) {
    this.mesh.position.set(x, y, z)
    this.velocity.set(0, 0, 0)
    this.curve = 0
    this.grounded = true
  }

  kick(vx: number, vy: number, vz: number, curve = 0) {
    this.velocity.set(vx, vy, vz)
    this.curve = curve
    this.grounded = false
    this.spinAxis.set(-vz, 0, vx).normalize()
  }

  update(dt: number, groundY = 0) {
    if (!this.grounded) {
      this.velocity.y -= GRAVITY * dt
      this.velocity.x += this.curve * dt
      // Light air drag so long chips don't accelerate forever.
      this.velocity.multiplyScalar(1 - AIR_DRAG * dt)
    }
    this.mesh.position.addScaledVector(this.velocity, dt)

    if (this.mesh.position.y <= groundY + BALL_RADIUS) {
      this.mesh.position.y = groundY + BALL_RADIUS
      if (this.velocity.y < 0) {
        this.velocity.y = -this.velocity.y * RESTITUTION
        if (Math.abs(this.velocity.y) < 0.6) {
          this.velocity.y = 0
          this.grounded = true
        }
      }
      // Rolling friction once it's settled onto the grass.
      const speed = Math.hypot(this.velocity.x, this.velocity.z)
      if (speed > 0) {
        const drop = Math.min(speed, GROUND_FRICTION * dt)
        const scale = (speed - drop) / speed
        this.velocity.x *= scale
        this.velocity.z *= scale
      }
      this.curve = 0
    }

    // Visual roll/spin - purely cosmetic, driven by how far it moved this frame.
    const dist = Math.hypot(this.velocity.x, this.velocity.z, this.velocity.y) * dt
    if (dist > 0.0001) {
      this.mesh.rotateOnWorldAxis(this.spinAxis, dist / BALL_RADIUS)
    }
  }

  get speed() {
    return this.velocity.length()
  }
}
