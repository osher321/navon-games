import * as THREE from 'three'

/**
 * An original, fully procedural low-poly human character - built entirely
 * from primitives (no imported model/rig/asset from any other game). The
 * limbs are simple pendulum groups pivoting at the shoulder/hip, which is
 * enough to drive a believable idle/walk/run cycle without a bones/skin
 * animation pipeline.
 */

export interface HumanoidParts {
  root: THREE.Group
  hips: THREE.Group
  torso: THREE.Mesh
  head: THREE.Group
  leftArm: THREE.Group
  rightArm: THREE.Group
  leftLeg: THREE.Group
  rightLeg: THREE.Group
  /** A canopy + strings rig, parented to `root` and hidden by default - toggled visible only while parachuting. */
  parachute: THREE.Group
  /** Where a two-handed weapon model attaches - a fixed point on the torso (not swinging with the walk-cycle arms), since an equipped weapon overrides arm rotation to a steady aim pose anyway. Empty until something is added to it. */
  weaponSocket: THREE.Group
}

const DEFAULT_COLORS = {
  jacket: 0x2fb6a8,
  jacketShade: 0x24897f,
  pants: 0x2b2f45,
  shoes: 0xf4f4f4,
  skin: 0xf2c49b,
  hair: 0x4a3423,
}

export type HumanoidPalette = typeof DEFAULT_COLORS

export const HIP_HEIGHT = 0.86
const LEG_LENGTH = 0.86
const TORSO_HEIGHT = 0.6
const ARM_LENGTH = 0.58
const SHOULDER_Y = 0.5
const SHOULDER_X = 0.32

function clothMat(color: number) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.75, metalness: 0.04 })
}
function skinMat(color: number) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.02 })
}

function limbMesh(length: number, radius: number, color: number) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length - radius * 1.6, 6, 10), clothMat(color))
  mesh.position.y = -length / 2
  mesh.castShadow = true
  return mesh
}

/** `palette` defaults to the player's exact signature colors - passing one in is how NPCs get a different, randomized look while sharing 100% of the same build/animate code. */
export function buildHumanoid(palette?: Partial<HumanoidPalette>): HumanoidParts {
  const COLORS = { ...DEFAULT_COLORS, ...palette }
  const root = new THREE.Group()

  // Legs pivot at the hip and hang straight down to the ground.
  const makeLeg = (side: 1 | -1) => {
    const pivot = new THREE.Group()
    pivot.position.set(side * 0.16, HIP_HEIGHT, 0)
    const leg = limbMesh(LEG_LENGTH, 0.15, COLORS.pants)
    pivot.add(leg)
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.32), new THREE.MeshStandardMaterial({ color: COLORS.shoes, roughness: 0.55, metalness: 0.05 }))
    shoe.position.set(0, -LEG_LENGTH + 0.07, 0.05)
    shoe.castShadow = true
    pivot.add(shoe)
    root.add(pivot)
    return pivot
  }
  const leftLeg = makeLeg(-1)
  const rightLeg = makeLeg(1)

  // Everything above the hips rides on a single group so idle breathing/bob
  // can move the whole upper body at once.
  const hips = new THREE.Group()
  hips.position.y = HIP_HEIGHT
  root.add(hips)

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.56, TORSO_HEIGHT, 0.32), clothMat(COLORS.jacket))
  torso.position.y = TORSO_HEIGHT / 2
  torso.castShadow = true
  hips.add(torso)

  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.08, 0.34), clothMat(COLORS.jacketShade))
  belt.position.y = 0.02
  hips.add(belt)

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.12, 10), skinMat(COLORS.skin))
  neck.position.y = TORSO_HEIGHT + 0.02
  neck.castShadow = true
  hips.add(neck)

  const makeArm = (side: 1 | -1) => {
    const pivot = new THREE.Group()
    pivot.position.set(side * SHOULDER_X, SHOULDER_Y, 0)
    const arm = limbMesh(ARM_LENGTH, 0.11, COLORS.jacket)
    pivot.add(arm)
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), skinMat(COLORS.skin))
    hand.position.y = -ARM_LENGTH + 0.05
    pivot.add(hand)
    hips.add(pivot)
    return pivot
  }
  const leftArm = makeArm(-1)
  const rightArm = makeArm(1)

  const head = new THREE.Group()
  head.position.y = TORSO_HEIGHT + 0.16
  hips.add(head)

  // A slightly squashed sphere reads far less "blocky" than a cube while
  // staying just as cheap to render.
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.18, 14, 12), skinMat(COLORS.skin))
  face.scale.set(1, 1.05, 0.92)
  face.castShadow = true
  head.add(face)

  const hair = new THREE.Mesh(new THREE.SphereGeometry(0.185, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.62), clothMat(COLORS.hair))
  hair.position.y = 0.05
  hair.scale.set(1.02, 1, 0.98)
  head.add(hair)

  const eyeGeo = new THREE.SphereGeometry(0.025, 8, 8)
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x22201f, roughness: 0.3 })
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
  leftEye.position.set(-0.07, 0.01, 0.15)
  head.add(leftEye)
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
  rightEye.position.set(0.07, 0.01, 0.15)
  head.add(rightEye)

  const parachute = buildParachuteRig()
  root.add(parachute)

  const weaponSocket = new THREE.Group()
  weaponSocket.position.set(0, SHOULDER_Y - 0.08, 0.32)
  hips.add(weaponSocket)

  return { root, hips, torso, head, leftArm, rightArm, leftLeg, rightLeg, parachute, weaponSocket }
}

/** A simple canopy + shoulder strings, hidden until the character is actually parachuting. */
function buildParachuteRig(): THREE.Group {
  const rig = new THREE.Group()
  rig.visible = false
  rig.position.y = HIP_HEIGHT + TORSO_HEIGHT + 0.6

  const canopy = new THREE.Mesh(
    new THREE.SphereGeometry(0.9, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
    new THREE.MeshStandardMaterial({ color: 0xe0537a, roughness: 0.7, side: THREE.DoubleSide })
  )
  canopy.position.y = 1.6
  canopy.castShadow = true
  rig.add(canopy)

  const stripeMat = new THREE.MeshStandardMaterial({ color: 0xf4f4f4, roughness: 0.7, side: THREE.DoubleSide })
  for (let i = 0; i < 4; i++) {
    const stripe = new THREE.Mesh(new THREE.SphereGeometry(0.905, 4, 8, (i / 4) * Math.PI * 2, 0.35, 0, Math.PI * 0.5), stripeMat)
    stripe.position.y = 1.6
    rig.add(stripe)
  }

  const lineMat = new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.6 })
  const lineGeo = new THREE.CylinderGeometry(0.012, 0.012, 1.5, 4)
  ;[
    [0.32, 0.14],
    [-0.32, 0.14],
    [0.32, -0.14],
    [-0.32, -0.14],
  ].forEach(([x, z]) => {
    const line = new THREE.Mesh(lineGeo, lineMat)
    line.position.set(x * 0.9, 0.85, z * 0.9)
    line.rotation.x = Math.atan2(z * 0.5, 1.5)
    line.rotation.z = -Math.atan2(x * 0.5, 1.5)
    rig.add(line)
  })

  return rig
}

const IDLE_BOB_SPEED = 1.8
const IDLE_BOB_AMOUNT = 0.015

/**
 * Drives a simple procedural walk/run cycle. `speed01` is 0 (idle) to 1
 * (walking) to beyond 1 (running) - it scales both the cycle rate and the
 * swing amplitude so faster movement visibly reads as running.
 */
export function animateHumanoid(parts: HumanoidParts, phase: number, speed01: number, dt: number) {
  const amount = Math.min(1, speed01)
  const swing = 0.55 + amount * 0.35

  // Mounting a vehicle or parachuting also twists the arms sideways
  // (rotation.z) for that pose - neither branch below touches rotation.x
  // and .z at different rates, so relax .z back to neutral here too or it
  // would stay stuck at whatever a previous pose left it at.
  parts.leftArm.rotation.z += (0 - parts.leftArm.rotation.z) * Math.min(1, dt * 6)
  parts.rightArm.rotation.z += (0 - parts.rightArm.rotation.z) * Math.min(1, dt * 6)

  if (speed01 > 0.02) {
    const s = Math.sin(phase)
    parts.leftLeg.rotation.x = s * swing
    parts.rightLeg.rotation.x = -s * swing
    parts.leftArm.rotation.x = -s * swing * 0.8
    parts.rightArm.rotation.x = s * swing * 0.8
    parts.hips.position.y = HIP_HEIGHT + Math.abs(Math.sin(phase)) * 0.03 * (0.4 + amount)
    parts.torso.rotation.x = -amount * 0.12
  } else {
    const idle = Math.sin(phase * IDLE_BOB_SPEED)
    parts.leftLeg.rotation.x += (0 - parts.leftLeg.rotation.x) * Math.min(1, dt * 8)
    parts.rightLeg.rotation.x += (0 - parts.rightLeg.rotation.x) * Math.min(1, dt * 8)
    parts.leftArm.rotation.x += (idle * 0.05 - parts.leftArm.rotation.x) * Math.min(1, dt * 4)
    parts.rightArm.rotation.x += (-idle * 0.05 - parts.rightArm.rotation.x) * Math.min(1, dt * 4)
    parts.hips.position.y = HIP_HEIGHT + idle * IDLE_BOB_AMOUNT
    parts.torso.rotation.x += (0 - parts.torso.rotation.x) * Math.min(1, dt * 4)
  }
}

/**
 * Swimming cycle - a symmetric dog-paddle arm stroke plus an alternating
 * flutter kick. The body itself is tilted horizontal by the caller
 * (Player owns that, since it also has to blend in/out at the water's
 * edge); this only drives the limbs relative to the hips/shoulders.
 */
export function animateSwimStroke(parts: HumanoidParts, phase: number, effort01: number, dt: number) {
  const amount = Math.max(0.35, Math.min(1, effort01))
  const stroke = Math.sin(phase)
  const armSwing = 0.55 + amount * 0.65

  parts.leftArm.rotation.x = -0.3 - stroke * armSwing
  parts.rightArm.rotation.x = -0.3 - stroke * armSwing
  parts.leftArm.rotation.z = 0.25 + Math.max(0, stroke) * 0.35
  parts.rightArm.rotation.z = -(0.25 + Math.max(0, stroke) * 0.35)

  const kick = Math.sin(phase * 2.2) * (0.35 + amount * 0.3)
  parts.leftLeg.rotation.x = kick
  parts.rightLeg.rotation.x = -kick

  parts.hips.position.y = HIP_HEIGHT + Math.sin(phase * 2.2) * 0.03
  parts.torso.rotation.x += (0 - parts.torso.rotation.x) * Math.min(1, dt * 4)
}
