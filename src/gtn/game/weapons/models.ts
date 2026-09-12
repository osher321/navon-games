import * as THREE from 'three'

/**
 * An original rotary-cannon-style "minigun" - a central spinning barrel
 * cluster (six barrels around a shaft), an ammo drum, a support ring and
 * two grips, all built from primitives like every other GTN asset. No part
 * of this measures or copies any real weapon or another game's model.
 */

function metal(color: number, roughness = 0.4, metalness = 0.7) {
  const mat = new THREE.MeshStandardMaterial({ color, roughness, metalness })
  return mat
}

function part(geometry: THREE.BufferGeometry, material: THREE.Material) {
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  return mesh
}

export function buildMinigun(): THREE.Group {
  const group = new THREE.Group()

  const housing = part(new THREE.BoxGeometry(0.22, 0.22, 0.5), metal(0x2b2d31, 0.5, 0.6))
  housing.position.set(0, 0, -0.35)
  group.add(housing)

  const drum = part(new THREE.CylinderGeometry(0.16, 0.16, 0.18, 12), metal(0x3a3d42, 0.6, 0.4))
  drum.rotation.x = Math.PI / 2
  drum.position.set(0, -0.2, -0.3)
  group.add(drum)

  // The rotating barrel cluster - its own group so it can be spun around
  // its own axis independently while firing.
  const barrelSpinner = new THREE.Group()
  barrelSpinner.position.set(0, 0, -0.05)
  const shaft = part(new THREE.CylinderGeometry(0.05, 0.05, 0.75, 10), metal(0x1c1d20, 0.5, 0.6))
  shaft.rotation.x = Math.PI / 2
  barrelSpinner.add(shaft)

  const barrelGeo = new THREE.CylinderGeometry(0.028, 0.028, 0.85, 8)
  const barrelMat = metal(0x14151a, 0.35, 0.75)
  const barrelCount = 6
  for (let i = 0; i < barrelCount; i++) {
    const angle = (i / barrelCount) * Math.PI * 2
    const barrel = part(barrelGeo, barrelMat)
    barrel.rotation.x = Math.PI / 2
    barrel.position.set(Math.cos(angle) * 0.09, Math.sin(angle) * 0.09, 0.05)
    barrelSpinner.add(barrel)
  }
  group.add(barrelSpinner)

  const ring = part(new THREE.TorusGeometry(0.1, 0.02, 6, 12), metal(0x2b2d31, 0.5, 0.6))
  ring.position.set(0, 0, 0.35)
  group.add(ring)

  const gripMat = metal(0x1c1c1c, 0.9, 0.05)
  const rearGrip = part(new THREE.BoxGeometry(0.06, 0.22, 0.08), gripMat)
  rearGrip.position.set(0, -0.16, -0.42)
  rearGrip.rotation.x = 0.25
  group.add(rearGrip)

  const frontGrip = part(new THREE.BoxGeometry(0.06, 0.2, 0.06), gripMat)
  frontGrip.position.set(0, -0.14, 0.15)
  group.add(frontGrip)

  // An empty marker at the muzzle tip - effects parent to this so they're
  // always correctly positioned/oriented without any extra math.
  const muzzle = new THREE.Object3D()
  muzzle.position.set(0, 0, 0.8)
  group.add(muzzle)

  group.userData.barrelSpinner = barrelSpinner
  group.userData.muzzle = muzzle
  return group
}
