import * as THREE from 'three'

/**
 * Original low-poly vehicle bodies - every part is a primitive built here,
 * nothing imported. Kept intentionally simple (a handful of meshes each)
 * so dozens can exist in the world without hurting frame rate. Paint uses
 * a glossy metal/clear-coat-ish PBR tuning (higher metalness, low
 * roughness) instead of flat matte color, which reads far less "plastic
 * toy" for very little extra cost.
 */

interface PaintOptions {
  metalness?: number
  roughness?: number
  emissive?: number
  emissiveIntensity?: number
}

function mesh(geometry: THREE.BufferGeometry, color: number, opts: PaintOptions = {}) {
  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissive ? opts.emissiveIntensity ?? 0.7 : 0,
    metalness: opts.metalness ?? 0.2,
    roughness: opts.roughness ?? 0.55,
  })
  const m = new THREE.Mesh(geometry, material)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function paintMesh(geometry: THREE.BufferGeometry, color: number, paint?: PaintOptions) {
  return mesh(geometry, color, { metalness: 0.65, roughness: 0.22, ...paint })
}

function wheel(radius: number, thickness: number) {
  const group = new THREE.Group()
  const tire = mesh(new THREE.TorusGeometry(radius, thickness, 8, 16), 0x1a1a1a, { metalness: 0.1, roughness: 0.85 })
  tire.rotation.y = Math.PI / 2
  group.add(tire)
  const rim = mesh(new THREE.CylinderGeometry(radius * 0.55, radius * 0.55, thickness * 1.6, 10), 0xcfd2d6, { metalness: 0.85, roughness: 0.3 })
  rim.rotation.z = Math.PI / 2
  group.add(rim)
  return group
}

/** A multi-spoke alloy wheel with a visible brake disc/caliper - reserved for the car, which the player sees up close. */
function sportWheel(radius: number, thickness: number) {
  const group = new THREE.Group()

  const tire = mesh(new THREE.TorusGeometry(radius, thickness, 8, 18), 0x151515, { metalness: 0.05, roughness: 0.9 })
  tire.rotation.y = Math.PI / 2
  group.add(tire)

  const hubR = radius * 0.62
  const disc = mesh(new THREE.CylinderGeometry(hubR, hubR, thickness * 0.35, 18), 0x9aa0a6, { metalness: 0.75, roughness: 0.35 })
  disc.rotation.z = Math.PI / 2
  group.add(disc)

  const spokeGeo = new THREE.BoxGeometry(thickness * 1.2, hubR * 1.75, thickness * 0.55)
  const spokeCount = 5
  for (let i = 0; i < spokeCount; i++) {
    const spoke = mesh(spokeGeo, 0xdfe2e6, { metalness: 0.88, roughness: 0.22 })
    spoke.rotation.x = (i / spokeCount) * Math.PI * 2
    group.add(spoke)
  }

  const hub = mesh(new THREE.CylinderGeometry(thickness * 0.85, thickness * 0.85, thickness * 1.8, 10), 0x232323, { metalness: 0.6, roughness: 0.35 })
  hub.rotation.z = Math.PI / 2
  group.add(hub)

  const caliper = mesh(new THREE.BoxGeometry(thickness * 1.5, hubR * 0.55, hubR * 0.32), 0xd6402e, { metalness: 0.25, roughness: 0.5 })
  caliper.position.set(0, hubR * 0.5, hubR * 0.7)
  group.add(caliper)

  return group
}

export function buildMotorcycle(color = 0xd6402e): THREE.Group {
  const group = new THREE.Group()

  const frame = paintMesh(new THREE.BoxGeometry(0.32, 0.32, 1.35), color)
  frame.position.set(0, 0.5, 0)
  group.add(frame)

  const tank = paintMesh(new THREE.BoxGeometry(0.36, 0.26, 0.46), color)
  tank.position.set(0, 0.78, 0.28)
  group.add(tank)

  const seat = mesh(new THREE.BoxGeometry(0.3, 0.1, 0.55), 0x232323, { roughness: 0.9 })
  seat.position.set(0, 0.72, -0.2)
  group.add(seat)

  const frontWheel = wheel(0.32, 0.09)
  frontWheel.position.set(0, 0.32, 0.62)
  group.add(frontWheel)

  const backWheel = wheel(0.32, 0.09)
  backWheel.position.set(0, 0.32, -0.58)
  group.add(backWheel)

  group.userData.wheels = [frontWheel, backWheel]
  group.userData.wheelRadius = 0.32

  const forkMat = 0x8b8b8b
  const fork = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 6), forkMat, { metalness: 0.7, roughness: 0.3 })
  fork.position.set(0, 0.5, 0.62)
  fork.rotation.x = -0.32
  group.add(fork)

  const handlebar = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.62, 6), forkMat, { metalness: 0.7, roughness: 0.3 })
  handlebar.rotation.z = Math.PI / 2
  handlebar.position.set(0, 0.92, 0.5)
  group.add(handlebar)

  const headlight = mesh(new THREE.SphereGeometry(0.09, 8, 8), 0xfff6d0, { emissive: 0xfff6d0 })
  headlight.position.set(0, 0.6, 0.86)
  group.add(headlight)

  group.userData.seatHeight = 0.78
  return group
}

const CAR_WIDTH = 1.86

/**
 * A single continuous wedge silhouette (nose -> hood -> windshield -> roof
 * -> fastback -> tail), built by extruding one 2D side-profile instead of
 * stacking separate body/nose/cabin boxes - the previous "Lego brick" look
 * came entirely from those box seams. This is still an original GTN shape
 * (no real car's panel lines or proportions were measured/copied), just a
 * generic "low sporty coupe" silhouette.
 */
function buildCarShell(color: number, paint?: PaintOptions) {
  const profile = new THREE.Shape()
  profile.moveTo(-1.85, 0.12)
  profile.lineTo(1.75, 0.1)
  profile.lineTo(1.95, 0.2)
  profile.lineTo(1.35, 0.42)
  profile.lineTo(0.85, 0.46)
  profile.lineTo(0.35, 0.92)
  profile.lineTo(-0.55, 0.95)
  profile.lineTo(-1.15, 0.58)
  profile.lineTo(-1.55, 0.52)
  profile.lineTo(-1.82, 0.34)
  profile.closePath()

  const geometry = new THREE.ExtrudeGeometry(profile, {
    depth: CAR_WIDTH,
    bevelEnabled: true,
    bevelThickness: 0.035,
    bevelSize: 0.035,
    bevelSegments: 2,
    curveSegments: 1,
  })
  // The shape's local (x, y) become the car's (length, height); rotating
  // -90 deg around Y then carries that length axis onto the car's forward
  // (+Z) axis, with the extrusion depth becoming the (centered) width.
  geometry.translate(0, 0, -CAR_WIDTH / 2)
  geometry.rotateY(-Math.PI / 2)
  return paintMesh(geometry, color, paint)
}

export function buildCar(color = 0x2f6fd6, paint?: PaintOptions): THREE.Group {
  const group = new THREE.Group()

  group.add(buildCarShell(color, paint))

  const glassMat: PaintOptions = { metalness: 0.4, roughness: 0.12 }
  const windshield = mesh(new THREE.BoxGeometry(1.5, 0.62, 0.06), 0x1c232c, glassMat)
  windshield.rotation.x = -0.86
  windshield.position.set(0, 0.66, 0.62)
  group.add(windshield)

  const rearGlass = mesh(new THREE.BoxGeometry(1.42, 0.6, 0.06), 0x1c232c, glassMat)
  rearGlass.rotation.x = 0.68
  rearGlass.position.set(0, 0.74, -0.86)
  group.add(rearGlass)

  const sideGlass = mesh(new THREE.BoxGeometry(1.56, 0.28, 0.95), 0x1c232c, glassMat)
  sideGlass.position.set(0, 0.84, -0.1)
  group.add(sideGlass)

  // Mirrors, side intakes and a rear diffuser - small cheap details that
  // read as "designed" rather than a bare painted block.
  const mirrorGeo = new THREE.BoxGeometry(0.05, 0.12, 0.22)
  ;[-0.95, 0.95].forEach((x) => {
    const mirror = paintMesh(mirrorGeo, color, paint)
    mirror.position.set(x, 0.72, 0.42)
    group.add(mirror)
  })

  const intakeGeo = new THREE.BoxGeometry(0.04, 0.16, 0.5)
  ;[-0.94, 0.94].forEach((x) => {
    const intake = mesh(intakeGeo, 0x141414, { roughness: 0.85 })
    intake.position.set(x, 0.3, -0.35)
    group.add(intake)
  })

  const diffuser = mesh(new THREE.BoxGeometry(1.55, 0.1, 0.28), 0x161616, { roughness: 0.8 })
  diffuser.position.set(0, 0.12, -1.82)
  group.add(diffuser)

  const spoilerStrutGeo = new THREE.BoxGeometry(0.06, 0.2, 0.06)
  ;[-0.7, 0.7].forEach((x) => {
    const strut = mesh(spoilerStrutGeo, 0x1c1c1c, { roughness: 0.6 })
    strut.position.set(x, 0.62, -1.72)
    group.add(strut)
  })
  const spoiler = paintMesh(new THREE.BoxGeometry(1.7, 0.06, 0.32), color, paint)
  spoiler.position.set(0, 0.74, -1.72)
  group.add(spoiler)

  const wheelPositions: [number, number][] = [
    [-0.96, 1.2],
    [0.96, 1.2],
    [-0.96, -1.15],
    [0.96, -1.15],
  ]
  const wheelRadius = 0.38
  const wheels = wheelPositions.map(([x, z]) => {
    const w = sportWheel(wheelRadius, 0.14)
    w.position.set(x, wheelRadius, z)
    group.add(w)
    return w
  })
  group.userData.wheels = wheels
  group.userData.wheelRadius = wheelRadius

  // Slim LED-style light bars instead of round bulbs, for a more modern face.
  const headlightGeo = new THREE.BoxGeometry(0.5, 0.07, 0.05)
  ;[-0.62, 0.62].forEach((x) => {
    const h = mesh(headlightGeo, 0xfff6d0, { emissive: 0xfff6d0, emissiveIntensity: 0.9 })
    h.position.set(x, 0.36, 1.97)
    group.add(h)
  })
  const taillightGeo = new THREE.BoxGeometry(0.5, 0.08, 0.05)
  ;[-0.62, 0.62].forEach((x) => {
    const t = mesh(taillightGeo, 0xff2d2d, { emissive: 0xff2d2d, emissiveIntensity: 0.6 })
    t.position.set(x, 0.4, -1.86)
    group.add(t)
  })

  group.userData.seatHeight = 0.6
  return group
}

export function buildJetSki(color = 0xffd23f): THREE.Group {
  const group = new THREE.Group()

  const hull = paintMesh(new THREE.CapsuleGeometry(0.42, 1.5, 4, 10), color)
  hull.rotation.x = Math.PI / 2
  hull.scale.set(1, 1, 0.6)
  hull.position.set(0, 0.3, 0)
  group.add(hull)

  const seat = mesh(new THREE.BoxGeometry(0.34, 0.16, 0.9), 0x232323, { roughness: 0.9 })
  seat.position.set(0, 0.52, -0.1)
  group.add(seat)

  const handleMat = 0x2a2a2a
  const handlePost = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6), handleMat, { metalness: 0.6, roughness: 0.35 })
  handlePost.position.set(0, 0.62, 0.55)
  group.add(handlePost)

  const handlebar = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), handleMat, { metalness: 0.6, roughness: 0.35 })
  handlebar.rotation.z = Math.PI / 2
  handlebar.position.set(0, 0.8, 0.55)
  group.add(handlebar)

  group.userData.seatHeight = 0.5
  return group
}

export function buildBoat(color = 0x3d78c9): THREE.Group {
  const group = new THREE.Group()

  const hull = paintMesh(new THREE.CapsuleGeometry(0.75, 2.6, 6, 12), color)
  hull.rotation.x = Math.PI / 2
  hull.scale.set(1, 1, 0.55)
  hull.position.set(0, 0.5, 0)
  group.add(hull)

  const deck = mesh(new THREE.BoxGeometry(1.3, 0.06, 2.4), 0xe6dcc5, { roughness: 0.8 })
  deck.position.set(0, 0.78, -0.1)
  group.add(deck)

  const console_ = paintMesh(new THREE.BoxGeometry(1.0, 0.7, 0.3), color)
  console_.position.set(0, 1.1, 0.75)
  group.add(console_)
  const windshield = mesh(new THREE.BoxGeometry(0.9, 0.35, 0.05), 0x1c232c, { metalness: 0.4, roughness: 0.15 })
  windshield.rotation.x = -0.5
  windshield.position.set(0, 1.5, 0.62)
  group.add(windshield)

  const seatGeo = new THREE.BoxGeometry(0.9, 0.35, 0.5)
  const seatMat = 0x232323
  const frontSeat = mesh(seatGeo, seatMat, { roughness: 0.9 })
  frontSeat.position.set(0, 0.95, 0.3)
  group.add(frontSeat)
  const backSeat = mesh(seatGeo, seatMat, { roughness: 0.9 })
  backSeat.position.set(0, 0.95, -0.85)
  group.add(backSeat)

  const motor = mesh(new THREE.BoxGeometry(0.4, 0.55, 0.3), 0x1c1c1c, { metalness: 0.4, roughness: 0.4 })
  motor.position.set(0, 0.5, -1.35)
  group.add(motor)
  const prop = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 6), 0x8b8b8b, { metalness: 0.7, roughness: 0.3 })
  prop.rotation.x = Math.PI / 2
  prop.position.set(0, 0.35, -1.55)
  group.add(prop)

  const railGeo = new THREE.CylinderGeometry(0.02, 0.02, 2.2, 6)
  ;[-0.62, 0.62].forEach((x) => {
    const rail = mesh(railGeo, 0xd8dbe0, { metalness: 0.7, roughness: 0.3 })
    rail.position.set(x, 1.05, -0.1)
    group.add(rail)
  })

  group.userData.seatHeight = 0.95
  return group
}

const PROP_BLADE_GEO = new THREE.BoxGeometry(0.1, 0.85, 0.03)

/**
 * A small original single-engine prop plane - a generic silhouette (round
 * nose, straight wings, single tail fin) rather than any specific real
 * aircraft's proportions. Landing gear reuses the same `wheel()` part (and
 * the generic wheel-spin in VehicleController) as the cars/motorcycle; the
 * propeller spins around its own forward axis via a separate mechanism
 * since its shaft runs the opposite way from an axle.
 */
export function buildAirplane(color = 0x3d78c9): THREE.Group {
  const group = new THREE.Group()

  const fuselage = paintMesh(new THREE.CapsuleGeometry(0.55, 3.2, 8, 12), color)
  fuselage.rotation.x = Math.PI / 2
  fuselage.position.set(0, 1.1, -0.3)
  group.add(fuselage)

  const canopy = mesh(new THREE.SphereGeometry(0.42, 12, 8, 0, Math.PI * 2, 0, Math.PI * 0.55), 0x1c232c, { metalness: 0.4, roughness: 0.15 })
  canopy.position.set(0, 1.55, 0.35)
  group.add(canopy)

  const wingGeo = new THREE.BoxGeometry(4.6, 0.1, 0.85)
  const wing = mesh(wingGeo, 0xf4f4f4, { roughness: 0.6 })
  wing.position.set(0, 1.05, -0.35)
  group.add(wing)

  const tailFin = mesh(new THREE.BoxGeometry(0.08, 0.75, 0.7), 0xf4f4f4, { roughness: 0.6 })
  tailFin.position.set(0, 1.55, -1.85)
  group.add(tailFin)

  const stabGeo = new THREE.BoxGeometry(1.5, 0.07, 0.45)
  const stab = mesh(stabGeo, 0xf4f4f4, { roughness: 0.6 })
  stab.position.set(0, 1.22, -1.85)
  group.add(stab)

  // Nose + spinning propeller.
  const nose = paintMesh(new THREE.ConeGeometry(0.42, 0.5, 10), color)
  nose.rotation.x = -Math.PI / 2
  nose.position.set(0, 1.1, 1.7)
  group.add(nose)

  const propGroup = new THREE.Group()
  propGroup.position.set(0, 1.1, 1.95)
  const spinner = mesh(new THREE.ConeGeometry(0.1, 0.15, 8), 0x2a2a2a, { metalness: 0.5, roughness: 0.4 })
  spinner.rotation.x = -Math.PI / 2
  propGroup.add(spinner)
  ;[0, Math.PI / 2, Math.PI, (Math.PI * 3) / 2].forEach((angle) => {
    const blade = mesh(PROP_BLADE_GEO, 0x2a2a2a, { metalness: 0.5, roughness: 0.4 })
    blade.rotation.z = angle
    propGroup.add(blade)
  })
  group.add(propGroup)
  group.userData.propeller = propGroup

  // Landing gear.
  const noseGear = wheel(0.2, 0.07)
  noseGear.position.set(0, 0.2, 1.1)
  group.add(noseGear)
  const leftGear = wheel(0.24, 0.08)
  leftGear.position.set(-0.9, 0.24, -0.4)
  group.add(leftGear)
  const rightGear = wheel(0.24, 0.08)
  rightGear.position.set(0.9, 0.24, -0.4)
  group.add(rightGear)
  group.userData.wheels = [noseGear, leftGear, rightGear]
  group.userData.wheelRadius = 0.22

  const stripeGeo = new THREE.BoxGeometry(0.12, 0.05, 3.2)
  const stripe = mesh(stripeGeo, 0xe0a637, { roughness: 0.5 })
  stripe.position.set(0, 1.35, -0.3)
  group.add(stripe)

  group.userData.seatHeight = 1.2
  return group
}

/**
 * A classic two-tone hot-air balloon - envelope built from two joined
 * sphere segments (a distinct color band near the base) rather than a
 * single flat-colored ball, plus a basket on support lines.
 */
export function buildBalloon(color = 0xe0537a, bandColor = 0xffd23f): THREE.Group {
  const group = new THREE.Group()

  const envelopeTop = mesh(new THREE.SphereGeometry(1.7, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.62), color, { roughness: 0.6 })
  envelopeTop.position.set(0, 3.6, 0)
  group.add(envelopeTop)

  const envelopeBand = mesh(new THREE.SphereGeometry(1.7, 16, 6, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.2), bandColor, { roughness: 0.6 })
  envelopeBand.position.set(0, 3.6, 0)
  group.add(envelopeBand)

  const neck = mesh(new THREE.CylinderGeometry(0.35, 0.55, 0.4, 12), color, { roughness: 0.6 })
  neck.position.set(0, 2.15, 0)
  group.add(neck)

  const burnerFrame = mesh(new THREE.TorusGeometry(0.55, 0.03, 6, 12), 0x2a2a2a, { metalness: 0.5, roughness: 0.4 })
  burnerFrame.rotation.x = Math.PI / 2
  burnerFrame.position.set(0, 1.75, 0)
  group.add(burnerFrame)

  const basket = mesh(new THREE.BoxGeometry(1.1, 0.75, 1.1), 0x8a6a45, { roughness: 0.9 })
  basket.position.set(0, 1.05, 0)
  group.add(basket)

  const ropeGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.1, 4)
  ;[
    [0.48, 0.48],
    [-0.48, 0.48],
    [0.48, -0.48],
    [-0.48, -0.48],
  ].forEach(([x, z]) => {
    const rope = mesh(ropeGeo, 0xcccccc, { roughness: 0.6 })
    rope.position.set(x * 0.85, 1.55, z * 0.85)
    rope.rotation.x = Math.atan2(z, 1.1) * 0.4
    rope.rotation.z = -Math.atan2(x, 1.1) * 0.4
    group.add(rope)
  })

  group.userData.seatHeight = 1.4
  return group
}
