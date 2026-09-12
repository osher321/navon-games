import * as THREE from 'three'
import { buildHumanoid, animateHumanoid, type HumanoidPalette } from './humanoid'
import type { LiveActor } from './regions/types'

/**
 * A curated pool of NPC looks - deliberately never reproduces the player's
 * exact teal-jacket/navy-pants/white-shoes combination (see humanoid.ts's
 * DEFAULT_COLORS), so the player stays instantly recognizable in a crowd.
 */
const NPC_PALETTES: Partial<HumanoidPalette>[] = [
  { jacket: 0xd6604a, jacketShade: 0xb44a37, pants: 0x2c2c2c, hair: 0x1c1c1c },
  { jacket: 0xe0c250, jacketShade: 0xb99b3a, pants: 0x3a3a55, hair: 0x6b4a2f, skin: 0xc98f5e },
  { jacket: 0x6b6f7a, jacketShade: 0x53565f, pants: 0x1c1f26, hair: 0x2a2a2a, skin: 0x8a5a3a },
  { jacket: 0x8a4fd6, jacketShade: 0x6c3ab0, pants: 0x2b2f45, hair: 0x0f0f0f },
  { jacket: 0xf28fb0, jacketShade: 0xd0678f, pants: 0x4a4a4a, hair: 0xd9a441, skin: 0xf2c49b },
  { jacket: 0x4a8f5c, jacketShade: 0x396f47, pants: 0x2c2c2c, hair: 0x3a2a1c, skin: 0x6b4226 },
  { jacket: 0xf4f4f4, jacketShade: 0xd8d8d8, pants: 0x1c1c1c, hair: 0x8a8a8a, skin: 0xe0a878 },
]

function pickPalette(seed: number): Partial<HumanoidPalette> {
  return NPC_PALETTES[seed % NPC_PALETTES.length]
}

const WALK_SPEED = 1.5
const ARRIVE_DIST = 0.3

/** Loops a walking NPC between hand-placed waypoints - no pathfinding or collision avoidance, matching the "basic system" scope already used for the airplane. */
export function buildPatrolNpc(waypoints: THREE.Vector3[], seed: number): LiveActor {
  const parts = buildHumanoid(pickPalette(seed))
  const root = parts.root
  root.position.copy(waypoints[0])
  let target = 1 % waypoints.length
  let facing = 0
  let phase = seed * 1.7

  return {
    root,
    update(dt: number) {
      const dest = waypoints[target]
      const dx = dest.x - root.position.x
      const dz = dest.z - root.position.z
      const dist = Math.hypot(dx, dz)
      if (dist < ARRIVE_DIST) {
        target = (target + 1) % waypoints.length
      } else {
        const dirX = dx / dist
        const dirZ = dz / dist
        root.position.x += dirX * WALK_SPEED * dt
        root.position.z += dirZ * WALK_SPEED * dt
        const targetFacing = Math.atan2(dx, dz)
        let delta = targetFacing - facing
        delta = Math.atan2(Math.sin(delta), Math.cos(delta))
        facing += delta * Math.min(1, 8 * dt)
        root.rotation.y = facing
      }
      phase += dt * 6
      animateHumanoid(parts, phase, 1, dt)
    },
  }
}

/** A static seated NPC (park bench, waterfront) - reuses the same seated-pose technique already built for vehicle drivers. */
export function buildSittingNpc(position: THREE.Vector3, heading: number, seed: number): LiveActor {
  const parts = buildHumanoid(pickPalette(seed))
  const root = parts.root
  root.position.copy(position)
  root.rotation.y = heading
  parts.leftLeg.rotation.x = 1.3
  parts.rightLeg.rotation.x = 1.3
  parts.leftArm.rotation.x = -0.2
  parts.rightArm.rotation.x = -0.2

  return {
    root,
    update() {
      // Static pose - no per-frame animation needed.
    },
  }
}
