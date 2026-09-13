import * as THREE from 'three'
import { buildHumanoid, type HumanoidPalette } from '../humanoid'
import type { LiveActor } from '../regions/types'

const CLERK_PALETTES: Partial<HumanoidPalette>[] = [
  { jacket: 0x3a5fd9, jacketShade: 0x2c49ad, pants: 0x1c2233, hair: 0x1c1c1c },
  { jacket: 0xd9a53a, jacketShade: 0xad822c, pants: 0x2c2c2c, hair: 0x4a3423, skin: 0xc98f5e },
  { jacket: 0x4a8f5c, jacketShade: 0x396f47, pants: 0x2c2c2c, hair: 0x2a2a2a },
]

/**
 * A stationary shop worker - the cashier behind a supermarket till, a
 * clothing-store clerk, a gun-shop attendant, a car salesperson. Reuses the
 * exact same procedural humanoid as the player/outdoor NPCs (no separate
 * character system), just held in place with a light idle sway plus a
 * periodic "working" arm motion so it doesn't read as a frozen mannequin.
 */
export function buildClerkNpc(position: THREE.Vector3, heading: number, seed: number): LiveActor {
  const parts = buildHumanoid(CLERK_PALETTES[seed % CLERK_PALETTES.length])
  const root = parts.root
  root.position.copy(position)
  root.rotation.y = heading
  let phase = seed * 2.1

  return {
    root,
    update(dt: number) {
      phase += dt
      // Idle sway (breathing) + a slow periodic "scan an item / handle
      // paperwork" arm reach, on a ~4s cycle so it never looks perfectly
      // static but also never looks like it's walking in place.
      const sway = Math.sin(phase * 1.4) * 0.02
      root.rotation.z = sway
      const workCycle = (phase % 4) / 4
      const reach = workCycle < 0.5 ? Math.sin(workCycle * Math.PI * 2) : 0
      parts.rightArm.rotation.x = -0.3 - reach * 0.6
      parts.leftArm.rotation.x = -0.1 - reach * 0.15
      parts.head.rotation.y = Math.sin(phase * 0.6) * 0.25
    },
  }
}
