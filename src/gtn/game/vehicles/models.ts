import * as THREE from 'three'

/**
 * Original low-poly vehicle bodies - every part is a primitive built here,
 * nothing imported. Kept intentionally simple (a handful of meshes each)
 * so dozens can exist in the world without hurting frame rate.
 */

function mesh(geometry: THREE.BufferGeometry, color: number, opts: { emissive?: number } = {}) {
  const material = new THREE.MeshStandardMaterial({ color, emissive: opts.emissive ?? 0x000000, emissiveIntensity: opts.emissive ? 0.7 : 0 })
  const m = new THREE.Mesh(geometry, material)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

function wheel(radius: number, thickness: number) {
  const m = mesh(new THREE.TorusGeometry(radius, thickness, 8, 16), 0x1c1c1c)
  m.rotation.y = Math.PI / 2
  return m
}

export function buildMotorcycle(color = 0xd6402e): THREE.Group {
  const group = new THREE.Group()

  const frame = mesh(new THREE.BoxGeometry(0.32, 0.32, 1.35), color)
  frame.position.set(0, 0.5, 0)
  group.add(frame)

  const tank = mesh(new THREE.BoxGeometry(0.36, 0.26, 0.46), color)
  tank.position.set(0, 0.78, 0.28)
  group.add(tank)

  const seat = mesh(new THREE.BoxGeometry(0.3, 0.1, 0.55), 0x232323)
  seat.position.set(0, 0.72, -0.2)
  group.add(seat)

  const frontWheel = wheel(0.32, 0.09)
  frontWheel.position.set(0, 0.32, 0.62)
  group.add(frontWheel)

  const backWheel = wheel(0.32, 0.09)
  backWheel.position.set(0, 0.32, -0.58)
  group.add(backWheel)

  const forkMat = 0x8b8b8b
  const fork = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.55, 6), forkMat)
  fork.position.set(0, 0.5, 0.62)
  fork.rotation.x = -0.32
  group.add(fork)

  const handlebar = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.62, 6), forkMat)
  handlebar.rotation.z = Math.PI / 2
  handlebar.position.set(0, 0.92, 0.5)
  group.add(handlebar)

  const headlight = mesh(new THREE.SphereGeometry(0.09, 8, 8), 0xfff6d0, { emissive: 0xfff6d0 })
  headlight.position.set(0, 0.6, 0.86)
  group.add(headlight)

  group.userData.seatHeight = 0.78
  return group
}

export function buildCar(color = 0x2f6fd6): THREE.Group {
  const group = new THREE.Group()

  const body = mesh(new THREE.BoxGeometry(1.7, 0.55, 3.4), color)
  body.position.set(0, 0.55, 0)
  group.add(body)

  const cabin = mesh(new THREE.BoxGeometry(1.4, 0.5, 1.7), color)
  cabin.position.set(0, 0.98, -0.1)
  group.add(cabin)

  const windshield = mesh(new THREE.BoxGeometry(1.32, 0.4, 0.06), 0x9fd8ff)
  windshield.position.set(0, 0.98, 0.72)
  group.add(windshield)

  const wheelPositions: [number, number][] = [
    [-0.9, 1.15],
    [0.9, 1.15],
    [-0.9, -1.15],
    [0.9, -1.15],
  ]
  wheelPositions.forEach(([x, z]) => {
    const w = wheel(0.38, 0.14)
    w.position.set(x, 0.38, z)
    group.add(w)
  })

  const headlightGeo = new THREE.SphereGeometry(0.1, 8, 8)
  ;[-0.55, 0.55].forEach((x) => {
    const h = mesh(headlightGeo, 0xfff6d0, { emissive: 0xfff6d0 })
    h.position.set(x, 0.55, 1.72)
    group.add(h)
  })

  group.userData.seatHeight = 0.98
  return group
}

export function buildJetSki(color = 0xffd23f): THREE.Group {
  const group = new THREE.Group()

  const hull = mesh(new THREE.CapsuleGeometry(0.42, 1.5, 4, 10), color)
  hull.rotation.x = Math.PI / 2
  hull.scale.set(1, 1, 0.6)
  hull.position.set(0, 0.3, 0)
  group.add(hull)

  const seat = mesh(new THREE.BoxGeometry(0.34, 0.16, 0.9), 0x232323)
  seat.position.set(0, 0.52, -0.1)
  group.add(seat)

  const handleMat = 0x2a2a2a
  const handlePost = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.4, 6), handleMat)
  handlePost.position.set(0, 0.62, 0.55)
  group.add(handlePost)

  const handlebar = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.5, 6), handleMat)
  handlebar.rotation.z = Math.PI / 2
  handlebar.position.set(0, 0.8, 0.55)
  group.add(handlebar)

  group.userData.seatHeight = 0.5
  return group
}
