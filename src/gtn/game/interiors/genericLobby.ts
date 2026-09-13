import * as THREE from 'three'
import type { Collider } from '../collision'
import type { InteriorBuild } from './types'
import { buildFloorHeightFn } from './types'
import { buildRoomShell, addRoomLight, disposeScene } from './roomKit'
import { buildSofa, buildCoffeeTable, buildPlant } from './parts'
import { buildClerkNpc } from './clerkNpc'
import { pickPalette, HOUSE_PALETTES } from './palette'

const WALL_H = 3.4
const W = 9
const D = 7

/**
 * The fallback interior for any building that doesn't (yet) have a
 * dedicated template - a downtown office/apartment tower today, and
 * whatever future building kind (bank, hotel, hospital, ...) hasn't earned
 * its own template yet. A real, walkable lobby (reception desk, seating,
 * an elevator-door prop hinting at the floors above) rather than a locked
 * door, which is what makes "every building in the city" true right now
 * instead of only for the kinds with bespoke content.
 */
export function buildGenericLobbyInterior(seed: number): InteriorBuild {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0d0d10)
  scene.add(new THREE.AmbientLight(0xffffff, 0.6))
  const palette = pickPalette(HOUSE_PALETTES, seed)

  const doorAt = W / 2
  const colliders: Collider[] = []
  const collidableMeshes: THREE.Object3D[] = []

  const shell = buildRoomShell({
    x0: 0,
    x1: W,
    z0: 0,
    z1: D,
    floorY: 0,
    wallHeight: WALL_H,
    wallColor: palette.wall,
    floorColor: 0xc9ccd1,
    ceilingColor: 0xf2f2f2,
    openings: [{ wall: 'S', at: doorAt, width: 2.0 }],
    windows: [{ wall: 'N', at: W / 2, width: 2.4 }],
  })
  scene.add(shell.group)
  colliders.push(...shell.colliders)
  collidableMeshes.push(...shell.collidableMeshes)
  addRoomLight(shell.group, W * 0.5, WALL_H - 0.3, D * 0.5, 0xffffff, 1.1, 9)

  const desk = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.95, 0.65), new THREE.MeshStandardMaterial({ color: 0x3a3a3f }))
  desk.position.set(W * 0.5, 0.475, D * 0.22)
  desk.castShadow = true
  desk.receiveShadow = true
  shell.group.add(desk)
  colliders.push({ minX: W * 0.5 - 0.95, maxX: W * 0.5 + 0.95, minZ: D * 0.22 - 0.35, maxZ: D * 0.22 + 0.35 })

  const sofa = buildSofa(W * 0.75, D * 0.68, 0, Math.PI, 1.7, palette.accent)
  shell.group.add(sofa.group)
  colliders.push(...sofa.colliders)
  const coffee = buildCoffeeTable(W * 0.75, D * 0.5, 0, 0)
  shell.group.add(coffee.group)
  colliders.push(...coffee.colliders)
  const plant = buildPlant(W * 0.15, D * 0.65, 0)
  shell.group.add(plant.group)
  colliders.push(...plant.colliders)

  // A closed elevator prop against the back wall - hints at the floors
  // above without simulating them (out of scope: a 20-story tower's every
  // floor isn't meaningfully walkable content on its own).
  const elevator = new THREE.Mesh(new THREE.BoxGeometry(1.3, 2.2, 0.1), new THREE.MeshStandardMaterial({ color: 0x8a8f94, metalness: 0.6, roughness: 0.3 }))
  elevator.position.set(W * 0.25, 1.1, D - 0.14)
  shell.group.add(elevator)
  const seam = new THREE.Mesh(new THREE.BoxGeometry(0.03, 2.2, 0.02), new THREE.MeshStandardMaterial({ color: 0x2c2c2c }))
  seam.position.set(W * 0.25, 1.1, D - 0.08)
  shell.group.add(seam)

  const npcs = [buildClerkNpc(new THREE.Vector3(W * 0.5, 0, D * 0.22 - 0.55), 0, seed)]
  npcs.forEach((n) => shell.group.add(n.root))

  const heightAt = buildFloorHeightFn([{ kind: 'flat', xMin: 0, xMax: W, zMin: 0, zMax: D, y: 0 }])

  return {
    scene,
    colliders,
    collidableMeshes,
    heightAt,
    bounds: { minX: 0.2, maxX: W - 0.2, minZ: 0.2, maxZ: D - 0.2 },
    spawnPoint: new THREE.Vector3(doorAt, 0, D - 1.0),
    spawnFacing: Math.PI,
    exitPoint: { position: new THREE.Vector3(doorAt, 0, D - 0.55), radius: 1.3 },
    interactables: [],
    npcs,
    dispose: () => disposeScene(scene),
  }
}
