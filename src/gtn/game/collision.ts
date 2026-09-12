/**
 * Lightweight kinematic collision - no physics engine. The city is static,
 * so its solid footprints are precomputed once as axis-aligned boxes; the
 * player is treated as a circle and resolved against them per-axis, which
 * gives natural wall-sliding without full rigid-body simulation.
 */
export interface Collider {
  minX: number
  maxX: number
  minZ: number
  maxZ: number
}

function circleOverlapsBox(cx: number, cz: number, radius: number, box: Collider): boolean {
  const closestX = Math.max(box.minX, Math.min(cx, box.maxX))
  const closestZ = Math.max(box.minZ, Math.min(cz, box.maxZ))
  const dx = cx - closestX
  const dz = cz - closestZ
  return dx * dx + dz * dz < radius * radius
}

export function resolveMove(
  colliders: Collider[],
  x: number,
  z: number,
  radius: number,
  dx: number,
  dz: number
): { x: number; z: number; blocked: boolean } {
  let nx = x
  let nz = z
  let blocked = false

  const tryX = x + dx
  if (dx !== 0) {
    if (!colliders.some((b) => circleOverlapsBox(tryX, nz, radius, b))) {
      nx = tryX
    } else {
      blocked = true
    }
  }

  const tryZ = z + dz
  if (dz !== 0) {
    if (!colliders.some((b) => circleOverlapsBox(nx, tryZ, radius, b))) {
      nz = tryZ
    } else {
      blocked = true
    }
  }

  return { x: nx, z: nz, blocked }
}
