import * as THREE from 'three'

/** A simple sun + sky-fill lighting rig, shared by every arcade game - not GTN's full day-cycle atmosphere system (these are shorter, simpler scenes that don't need it), just enough for shadows and readable color. */
export function setupBasicLighting(scene: THREE.Scene, skyColor: number, fogColor: number = skyColor, fogDensity = 0.012) {
  scene.background = new THREE.Color(skyColor)
  scene.fog = new THREE.FogExp2(fogColor, fogDensity)

  const hemi = new THREE.HemisphereLight(skyColor, 0x3a3a3a, 0.9)
  scene.add(hemi)

  const sun = new THREE.DirectionalLight(0xffffff, 1.4)
  sun.position.set(30, 40, 20)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  sun.shadow.camera.left = -40
  sun.shadow.camera.right = 40
  sun.shadow.camera.top = 40
  sun.shadow.camera.bottom = -40
  sun.shadow.camera.far = 120
  scene.add(sun)
  scene.add(sun.target)

  return { hemi, sun }
}

/** Recursively frees GPU resources (geometry/material/textures) for everything under `root`, then clears the scene graph. Removing an object from the scene graph alone never releases its GPU buffers - skipping this is how a game that gets started/restarted/exited several times in one session slowly leaks VRAM. */
export function disposeObject3D(root: THREE.Object3D) {
  root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()
    const material = mesh.material as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(material)) material.forEach(disposeMaterial)
    else if (material) disposeMaterial(material)
  })
}

function disposeMaterial(material: THREE.Material) {
  for (const key of Object.keys(material)) {
    const value = (material as unknown as Record<string, unknown>)[key]
    if (value instanceof THREE.Texture) value.dispose()
  }
  material.dispose()
}

export function buildGroundPlane(size: number, color: number) {
  const geo = new THREE.PlaneGeometry(size, size)
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.95, metalness: 0 })
  const ground = new THREE.Mesh(geo, mat)
  ground.rotation.x = -Math.PI / 2
  ground.receiveShadow = true
  return ground
}
