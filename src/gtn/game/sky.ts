import * as THREE from 'three'

/**
 * A cheap gradient skydome - one big inverted sphere with a small vertical
 * gradient canvas texture, instead of a flat background color. Adds real
 * atmosphere (a horizon haze, a brighter zenith) for the cost of one extra
 * draw call.
 */
export function buildSky(radius: number): THREE.Mesh {
  const canvas = document.createElement('canvas')
  canvas.width = 2
  canvas.height = 256
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createLinearGradient(0, 0, 0, 256)
  gradient.addColorStop(0, '#2f8fe0')
  gradient.addColorStop(0.45, '#7fc4ef')
  gradient.addColorStop(0.75, '#cfeaf6')
  gradient.addColorStop(1, '#fdf6e3')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 2, 256)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace

  const geometry = new THREE.SphereGeometry(radius, 24, 16)
  const material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.BackSide, fog: false, depthWrite: false })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.renderOrder = -1
  return mesh
}

/**
 * A prefiltered image-based-lighting environment, generated once from a
 * tiny throwaway scene (the same sky gradient plus a bright patch standing
 * in for the sun) rather than loaded from an HDR file. Setting this as
 * `scene.environment` gives every metallic PBR material (gold car paint,
 * glass, chrome rims) real-looking reflections for a one-time setup cost -
 * no per-frame cubemap render, no extra asset download.
 */
export function buildEnvironment(renderer: THREE.WebGLRenderer): THREE.Texture {
  const pmrem = new THREE.PMREMGenerator(renderer)
  pmrem.compileEquirectangularShader()

  const envScene = new THREE.Scene()
  envScene.add(buildSky(40))

  const sunGlow = new THREE.Mesh(
    new THREE.SphereGeometry(3, 12, 8),
    new THREE.MeshBasicMaterial({ color: 0xfff3d0 })
  )
  sunGlow.position.set(18, 22, 10)
  envScene.add(sunGlow)

  // Kept close to neutral gray rather than saturated grass-green - a
  // strongly colored "ground" here would tint every reflective material in
  // the scene (most noticeably the gold car paint) toward that color.
  const groundGlow = new THREE.Mesh(
    new THREE.SphereGeometry(38, 16, 8, 0, Math.PI * 2, Math.PI * 0.55, Math.PI * 0.45),
    new THREE.MeshBasicMaterial({ color: 0x9a9488, side: THREE.BackSide })
  )
  envScene.add(groundGlow)

  const renderTarget = pmrem.fromScene(envScene, 0.04)
  pmrem.dispose()
  return renderTarget.texture
}
