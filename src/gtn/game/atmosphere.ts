import * as THREE from 'three'

/**
 * One preset bundles every value a given time of day would touch - only
 * `DAY` is actually used right now (matching GTN's existing lighting
 * exactly, so this introduces zero visual change today), but a future
 * `setTimeOfDay()` could swap in a SUNSET/NIGHT preset by applying a
 * different one of these to the same light objects, without any of the
 * surrounding scene/vehicle/camera code needing to know time-of-day exists.
 */
export interface TimeOfDayPreset {
  sunDirection: THREE.Vector3
  sunColor: number
  sunIntensity: number
  fillColor: number
  hemiSky: number
  hemiGround: number
  fogColor: number
  fogDensity: number
}

export const DAY_PRESET: TimeOfDayPreset = {
  sunDirection: new THREE.Vector3(28, 38, 14).normalize(),
  sunColor: 0xfff2d6,
  sunIntensity: 1.35,
  fillColor: 0xbcd9ff,
  hemiSky: 0xbfe3ff,
  hemiGround: 0x6b6255,
  fogColor: 0xcfeaf6,
  fogDensity: 0.0105,
}

/** A visible sun disc + soft glow - a DirectionalLight alone lights the scene but is never itself something the player can see "in the sky". Recentered on the camera every frame at a fixed distance along the sun direction, the same trick the sky dome uses, so it always sits correctly in the sky regardless of how far the player roams. */
export function buildSunVisual(): THREE.Group {
  const group = new THREE.Group()
  const core = new THREE.Mesh(new THREE.SphereGeometry(4, 16, 12), new THREE.MeshBasicMaterial({ color: 0xfff6d8, fog: false, toneMapped: false }))
  group.add(core)
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(7.5, 16, 12),
    new THREE.MeshBasicMaterial({ color: 0xfff0b0, transparent: true, opacity: 0.35, fog: false, depthWrite: false, toneMapped: false })
  )
  group.add(glow)
  return group
}
