/**
 * One shared config shape for every weapon - mirrors the same pattern
 * already used for vehicles (`VEHICLE_CONFIGS`). Adding a second weapon
 * later means adding a mesh builder + one entry here; the equip/fire/
 * reload/HUD code in WeaponSystem stays untouched.
 */
export type WeaponKind = 'minigun'

export interface WeaponConfig {
  kind: WeaponKind
  /** Shots per second while the trigger is held. */
  fireRate: number
  damage: number
  magazineSize: number
  reserveAmmo: number
  reloadTime: number
  /** Raycast max distance. */
  range: number
  /** Random cone half-angle (radians) added to the aim direction per shot. */
  spreadRadians: number
}

export const WEAPON_CONFIGS: Record<WeaponKind, WeaponConfig> = {
  minigun: {
    kind: 'minigun',
    fireRate: 12,
    damage: 8,
    magazineSize: 60,
    reserveAmmo: 240,
    reloadTime: 2.2,
    range: 80,
    spreadRadians: 0.035,
  },
}
