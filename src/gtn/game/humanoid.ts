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
}

const COLORS = {
  jacket: 0x2fb6a8,
  jacketShade: 0x24897f,
  pants: 0x2b2f45,
  shoes: 0xf4f4f4,
  skin: 0xf2c49b,
  hair: 0x4a3423,
}

const HIP_HEIGHT = 0.86
const LEG_LENGTH = 0.86
const TORSO_HEIGHT = 0.6
const ARM_LENGTH = 0.58
const SHOULDER_Y = 0.5
const SHOULDER_X = 0.32

function limbMesh(length: number, radius: number, color: number) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length - radius * 1.6, 4, 8), new THREE.MeshStandardMaterial({ color }))
  mesh.position.y = -length / 2
  mesh.castShadow = true
  return mesh
}

export function buildHumanoid(): HumanoidParts {
  const root = new THREE.Group()

  // Legs pivot at the hip and hang straight down to the ground.
  const makeLeg = (side: 1 | -1) => {
    const pivot = new THREE.Group()
    pivot.position.set(side * 0.16, HIP_HEIGHT, 0)
    const leg = limbMesh(LEG_LENGTH, 0.15, COLORS.pants)
    pivot.add(leg)
    const shoe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.32), new THREE.MeshStandardMaterial({ color: COLORS.shoes }))
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

  const torso = new THREE.Mesh(
    new THREE.BoxGeometry(0.56, TORSO_HEIGHT, 0.32),
    new THREE.MeshStandardMaterial({ color: COLORS.jacket })
  )
  torso.position.y = TORSO_HEIGHT / 2
  torso.castShadow = true
  hips.add(torso)

  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.08, 0.34), new THREE.MeshStandardMaterial({ color: COLORS.jacketShade }))
  belt.position.y = 0.02
  hips.add(belt)

  const makeArm = (side: 1 | -1) => {
    const pivot = new THREE.Group()
    pivot.position.set(side * SHOULDER_X, SHOULDER_Y, 0)
    const arm = limbMesh(ARM_LENGTH, 0.11, COLORS.jacket)
    pivot.add(arm)
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10), new THREE.MeshStandardMaterial({ color: COLORS.skin }))
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

  const face = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.32, 0.3), new THREE.MeshStandardMaterial({ color: COLORS.skin }))
  face.castShadow = true
  head.add(face)

  const hair = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.14, 0.32), new THREE.MeshStandardMaterial({ color: COLORS.hair }))
  hair.position.y = 0.2
  head.add(hair)

  const eyeGeo = new THREE.SphereGeometry(0.025, 8, 8)
  const eyeMat = new THREE.MeshStandardMaterial({ color: 0x22201f })
  const leftEye = new THREE.Mesh(eyeGeo, eyeMat)
  leftEye.position.set(-0.08, 0.02, 0.155)
  head.add(leftEye)
  const rightEye = new THREE.Mesh(eyeGeo, eyeMat)
  rightEye.position.set(0.08, 0.02, 0.155)
  head.add(rightEye)

  return { root, hips, torso, head, leftArm, rightArm, leftLeg, rightLeg }
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
