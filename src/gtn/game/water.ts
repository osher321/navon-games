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
  varying vec3 vViewNormal;
  varying vec3 vViewDir;

  float waveHeight(vec2 p) {
    return sin(p.x * 0.25 + uTime * 1.3) * 0.25
         + sin(p.y * 0.35 - uTime * 1.7) * 0.18
         + sin((p.x + p.y) * 0.15 + uTime * 0.8) * 0.15;
  }

  void main() {
    vec3 pos = position;
    // The mesh is later rotated -90 deg around X to lay it flat, which (for
    // this particular rotation) flips local Y onto world Z with a sign
    // flip: local.y = -world.z. Un-flip it here so this shader samples the
    // exact same (worldX, worldZ) that the JS-side waveHeightAt() uses for
    // vehicles floating on the water - otherwise the rendered wave pattern
    // and the physics height desync.
    vec2 worldXZ = vec2(pos.x, -pos.y);
    float h = waveHeight(worldXZ);
    pos.z += h;
    vHeight = h;

    // Cheap analytic normal from finite differences of the same height
    // field, transformed by the standard normal matrix so it lines up
    // with the view-space view direction below (mixing spaces here would
    // put the sun glint in the wrong place as the camera turns).
    float eps = 0.6;
    float hx = waveHeight(worldXZ + vec2(eps, 0.0)) - waveHeight(worldXZ - vec2(eps, 0.0));
    float hy = waveHeight(worldXZ + vec2(0.0, eps)) - waveHeight(worldXZ - vec2(0.0, eps));
    // hy is a world-Z slope but the normal needs to be in local space
    // (local.y = -world.z), so its sign flips relative to hx (which needs
    // no such correction - local.x = world.x with no flip).
    vec3 localNormal = normalize(vec3(-hx, hy, 2.0 * eps));
    vViewNormal = normalize(normalMatrix * localNormal);

    vec4 mv = modelViewMatrix * vec4(pos, 1.0);
    vViewDir = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uSunDir;
  varying float vHeight;
  varying vec3 vViewNormal;
  varying vec3 vViewDir;

  void main() {
    vec3 color = mix(uDeep, uShallow, smoothstep(-0.2, 0.4, vHeight));

    vec3 sunDirView = normalize((viewMatrix * vec4(uSunDir, 0.0)).xyz);
    vec3 halfVec = normalize(sunDirView + vViewDir);
    float spec = pow(max(dot(vViewNormal, halfVec), 0.0), 70.0);
    float fresnel = pow(1.0 - max(dot(vViewNormal, vViewDir), 0.0), 3.0);

    color += vec3(1.0, 0.97, 0.85) * spec * 0.9;
    color = mix(color, vec3(0.85, 0.95, 1.0), fresnel * 0.35);

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
  // The mesh's -90 deg X rotation below maps local Y to world Z with a
  // sign flip, so centering it at world Z = centerZ means translating the
  // pre-rotation geometry by -centerZ here, not +centerZ.
  geometry.translate(centerX, -centerZ, 0)
  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uDeep: { value: new THREE.Color(0x0f6f9e) },
      uShallow: { value: new THREE.Color(0x4fc4d9) },
      // Matches the DirectionalLight("sun") position in GameCanvas so the
      // glint lands on the same side as the actual light in the scene.
      uSunDir: { value: new THREE.Vector3(28, 38, 14).normalize() },
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
