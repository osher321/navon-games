import * as THREE from 'three'

/**
 * A small original animated-water system - no imported textures/assets.
 * The surface is a plain shader (sum of a few sine waves) so it's cheap
 * enough for mobile GPUs, and `getWaveHeight` mirrors the exact same math
 * in JS so vehicles floating on the water (jet ski) can sit on the waves.
 */

const VERTEX_SHADER = /* glsl */ `
  uniform float uTime;
  varying float vHeight;
  varying vec2 vWorldXZ;

  void main() {
    vec3 pos = position;
    float h = sin(pos.x * 0.25 + uTime * 1.3) * 0.25
            + sin(pos.y * 0.35 - uTime * 1.7) * 0.18
            + sin((pos.x + pos.y) * 0.15 + uTime * 0.8) * 0.15;
    pos.z += h;
    vHeight = h;
    vWorldXZ = pos.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  varying float vHeight;

  void main() {
    vec3 color = mix(uDeep, uShallow, smoothstep(-0.2, 0.4, vHeight));
    gl_FragColor = vec4(color, 0.92);
  }
`

export function waveHeightAt(x: number, z: number, time: number): number {
  return (
    Math.sin(x * 0.25 + time * 1.3) * 0.25 +
    Math.sin(z * 0.35 - time * 1.7) * 0.18 +
    Math.sin((x + z) * 0.15 + time * 0.8) * 0.15
  )
}

export interface OceanMesh {
  mesh: THREE.Mesh
  material: THREE.ShaderMaterial
  update: (time: number) => void
}

export function buildOcean(width: number, depth: number, centerX: number, centerZ: number): OceanMesh {
  const geometry = new THREE.PlaneGeometry(width, depth, Math.min(80, Math.round(width / 2)), Math.min(80, Math.round(depth / 2)))
  // Bake the world offset into the geometry (pre-rotation) so the vertex
  // shader's `position.xy` already equals world (x, z) - that keeps the
  // rendered waves and the JS-side `waveHeightAt` sampled by vehicles in
  // exact sync.
  geometry.translate(centerX, centerZ, 0)
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(0x0f6f9e) },
      uShallow: { value: new THREE.Color(0x4fc4d9) },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.rotation.x = -Math.PI / 2
  mesh.receiveShadow = false

  return {
    mesh,
    material,
    update: (time: number) => {
      material.uniforms.uTime.value = time
    },
  }
}
