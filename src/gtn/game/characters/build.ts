import * as THREE from 'three'
import { HIP_HEIGHT, LEG_LENGTH, TORSO_HEIGHT, ARM_LENGTH, SHOULDER_Y, SHOULDER_X, buildParachuteRig, type HumanoidParts } from '../humanoid'
import type { CharacterDef, CharacterAccessory, HairStyle, CharacterPalette } from './types'

/**
 * Parametric builder for the 10 selectable player characters. Reuses the
 * exact same pivot geometry (HIP_HEIGHT/LEG_LENGTH/TORSO_HEIGHT/ARM_LENGTH/
 * SHOULDER_*) and the same HumanoidParts shape as buildHumanoid()/the
 * former robot builder, which is what lets every downstream system -
 * animateHumanoid/animateSwimStroke, Player's driving/parachute/aim
 * poses, the weapon socket, vehicle seat math, and the chase camera's
 * tuned lookHeight - keep working unmodified no matter which of the 10
 * characters is active. Only the meshes/materials attached to each pivot,
 * and a couple of geometry-only width tweaks, differ per character.
 */

function bodyMat(color: number, metalness = 0.15, roughness = 0.55) {
  return new THREE.MeshStandardMaterial({ color, metalness, roughness })
}
function skinMat(color: number) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.02 })
}
function glowMat(color: number) {
  return new THREE.MeshBasicMaterial({ color, toneMapped: false })
}
function hairMat(color: number, metallic = false) {
  return new THREE.MeshStandardMaterial({ color, roughness: metallic ? 0.3 : 0.6, metalness: metallic ? 0.6 : 0.05 })
}

function limbMesh(length: number, radius: number, color: number) {
  const mesh = new THREE.Mesh(new THREE.CapsuleGeometry(radius, length - radius * 1.6, 6, 10), bodyMat(color))
  mesh.position.y = -length / 2
  mesh.castShadow = true
  return mesh
}

// ---- Hair --------------------------------------------------------------
// Each style is its own small geometry composition (2-6 cheap meshes) so
// the 10 characters read as genuinely different silhouettes, not one
// hairstyle recolored ten times.
function buildHair(style: HairStyle, palette: CharacterPalette): THREE.Group {
  const group = new THREE.Group()
  const mat = hairMat(palette.hair, style === 'sleek-silver')

  const skullcap = () => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.185, 14, 10, 0, Math.PI * 2, 0, Math.PI * 0.6), mat)
    m.position.y = 0.05
    m.scale.set(1.02, 1, 0.98)
    return m
  }
  const cone = (radius: number, height: number, pos: [number, number, number], rot: [number, number, number], material = mat) => {
    const m = new THREE.Mesh(new THREE.ConeGeometry(radius, height, 6), material)
    m.position.set(...pos)
    m.rotation.set(...rot)
    return m
  }

  switch (style) {
    case 'long-flow': {
      group.add(skullcap())
      const strandGeo = new THREE.BoxGeometry(0.07, 0.55, 0.03)
      ;[-1, 1].forEach((side) => {
        const strand = new THREE.Mesh(strandGeo, mat)
        strand.position.set(side * 0.14, -0.2, -0.05)
        strand.rotation.z = side * 0.08
        group.add(strand)
      })
      const back = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.5, 0.05), mat)
      back.position.set(0, -0.18, -0.11)
      group.add(back)
      break
    }
    case 'short-spiky': {
      group.add(skullcap())
      for (let i = 0; i < 6; i++) {
        const ang = (i / 6) * Math.PI * 2
        group.add(cone(0.035, 0.12, [Math.cos(ang) * 0.1, 0.16, Math.sin(ang) * 0.1], [Math.sin(ang) * 0.5, 0, -Math.cos(ang) * 0.5]))
      }
      break
    }
    case 'sleek-silver': {
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.182, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.58), mat)
      cap.position.y = 0.05
      group.add(cap)
      const fringe = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.06, 0.05), mat)
      fringe.position.set(0.05, 0.11, 0.13)
      fringe.rotation.z = -0.35
      group.add(fringe)
      break
    }
    case 'wavy-shoulder': {
      group.add(skullcap())
      ;[-1, 1].forEach((side) => {
        const wave = new THREE.Mesh(new THREE.CapsuleGeometry(0.07, 0.32, 3, 6), mat)
        wave.position.set(side * 0.16, -0.14, -0.02)
        wave.rotation.z = side * 0.22
        group.add(wave)
      })
      break
    }
    case 'flame-cut': {
      group.add(skullcap())
      for (let i = 0; i < 5; i++) {
        const t = i / 4
        group.add(cone(0.045, 0.22 - t * 0.08, [(t - 0.5) * 0.28, -0.02 - t * 0.05, -0.13], [1.9, 0, (t - 0.5) * 0.6]))
      }
      break
    }
    case 'swept-spiky': {
      group.add(skullcap())
      group.add(cone(0.09, 0.26, [0.02, 0.2, 0.05], [0.5, 0, -0.15]))
      group.add(cone(0.05, 0.16, [-0.1, 0.15, -0.02], [0.3, 0, 0.4]))
      group.add(cone(0.05, 0.16, [0.13, 0.14, -0.04], [0.3, 0, -0.5]))
      break
    }
    case 'short-crop': {
      group.add(skullcap())
      break
    }
    case 'two-tone-tips': {
      group.add(skullcap())
      const tipMat = hairMat(palette.hairAccent ?? palette.hair)
      for (let i = 0; i < 5; i++) {
        const ang = (i / 5) * Math.PI * 2
        const tip = cone(0.028, 0.08, [Math.cos(ang) * 0.11, 0.19, Math.sin(ang) * 0.11], [Math.sin(ang) * 0.5, 0, -Math.cos(ang) * 0.5], tipMat)
        group.add(tip)
      }
      break
    }
    case 'tousled-wild': {
      group.add(skullcap())
      const rng = [0.3, -0.5, 0.7, -0.2, 0.5, -0.7, 0.15]
      for (let i = 0; i < 7; i++) {
        const ang = (i / 7) * Math.PI * 2 + rng[i]
        group.add(cone(0.032 + (i % 2) * 0.01, 0.1 + (i % 3) * 0.03, [Math.cos(ang) * 0.1, 0.17 + (i % 2) * 0.03, Math.sin(ang) * 0.1], [rng[i], ang, 0]))
      }
      break
    }
    case 'tousled-golden': {
      group.add(skullcap())
      for (let i = 0; i < 5; i++) {
        const ang = (i / 5) * Math.PI * 2 + 0.3
        const bump = new THREE.Mesh(new THREE.SphereGeometry(0.06, 8, 6), mat)
        bump.position.set(Math.cos(ang) * 0.12, 0.15 + Math.random() * 0.02, Math.sin(ang) * 0.12)
        group.add(bump)
      }
      break
    }
  }
  return group
}

// ---- Face ---------------------------------------------------------------
function buildFace(head: THREE.Group, palette: CharacterPalette) {
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 14), skinMat(palette.skin))
  face.scale.set(1, 1.05, 0.92)
  face.castShadow = true
  head.add(face)

  // Large, clearly visible, glowing-eyed - each eye is a colored iris disc
  // plus a small emissive highlight dot so they read as alive, not flat.
  const irisGeo = new THREE.SphereGeometry(0.032, 10, 8)
  const irisMat = new THREE.MeshStandardMaterial({ color: palette.eye, emissive: palette.eye, emissiveIntensity: 0.55, roughness: 0.25 })
  const highlightGeo = new THREE.SphereGeometry(0.01, 6, 6)
  const highlightMat = glowMat(0xffffff)
  ;[-1, 1].forEach((side) => {
    const iris = new THREE.Mesh(irisGeo, irisMat)
    iris.position.set(side * 0.075, 0.015, 0.152)
    head.add(iris)
    const highlight = new THREE.Mesh(highlightGeo, highlightMat)
    highlight.position.set(side * 0.075 + 0.012, 0.03, 0.17)
    head.add(highlight)
  })

  // A simple friendly mouth line.
  const mouth = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.012, 0.012), new THREE.MeshStandardMaterial({ color: 0x8a4a3a, roughness: 0.6 }))
  mouth.position.set(0, -0.075, 0.165)
  head.add(mouth)
}

// ---- Accessories ---------------------------------------------------------
function attachAccessory(kind: CharacterAccessory, hips: THREE.Group, palette: CharacterPalette) {
  if (kind === 'wings') {
    ;[-1, 1].forEach((side) => {
      const fin = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.32, 4), glowMat(palette.glow))
      fin.position.set(side * 0.26, TORSO_HEIGHT - 0.05, -0.08)
      fin.rotation.z = side * 0.9
      fin.rotation.x = 0.3
      hips.add(fin)
    })
  } else if (kind === 'scarf') {
    const scarf = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.03, 6, 12), bodyMat(palette.glow, 0.1, 0.5))
    scarf.rotation.x = Math.PI / 2
    scarf.position.set(0, TORSO_HEIGHT + 0.03, 0)
    hips.add(scarf)
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.28, 0.02), bodyMat(palette.glow, 0.1, 0.5))
    tail.position.set(0.1, TORSO_HEIGHT - 0.12, -0.12)
    tail.rotation.z = 0.2
    hips.add(tail)
  } else if (kind === 'racing-stripe') {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.08, TORSO_HEIGHT * 0.85, 0.01), glowMat(palette.glow))
    stripe.position.set(0, TORSO_HEIGHT / 2, 0.165)
    hips.add(stripe)
  } else if (kind === 'strap') {
    const strap = new THREE.Mesh(new THREE.BoxGeometry(0.07, TORSO_HEIGHT * 0.95, 0.34), bodyMat(palette.outfitShade, 0.15, 0.6))
    strap.position.set(0.12, TORSO_HEIGHT / 2, 0)
    strap.rotation.z = 0.5
    hips.add(strap)
  }
}

export function buildCharacter(def: CharacterDef): HumanoidParts {
  const p = def.palette
  const bw = def.build ?? 1

  const root = new THREE.Group()

  const makeLeg = (side: 1 | -1) => {
    const pivot = new THREE.Group()
    pivot.position.set(side * 0.16, HIP_HEIGHT, 0)
    const leg = limbMesh(LEG_LENGTH, 0.14 * bw, p.outfitShade)
    pivot.add(leg)
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.2 * bw, 0.15, 0.3), bodyMat(0x161616, 0.2, 0.6))
    boot.position.set(0, -LEG_LENGTH + 0.075, 0.04)
    boot.castShadow = true
    pivot.add(boot)
    const bootGlow = new THREE.Mesh(new THREE.BoxGeometry(0.21 * bw, 0.015, 0.31), glowMat(p.glow))
    bootGlow.position.set(0, -LEG_LENGTH + 0.005, 0.04)
    pivot.add(bootGlow)
    root.add(pivot)
    return pivot
  }
  const leftLeg = makeLeg(-1)
  const rightLeg = makeLeg(1)

  const hips = new THREE.Group()
  hips.position.y = HIP_HEIGHT
  root.add(hips)

  const torso = new THREE.Mesh(new THREE.BoxGeometry(0.54 * bw, TORSO_HEIGHT, 0.3 * bw), bodyMat(p.outfit))
  torso.position.y = TORSO_HEIGHT / 2
  torso.castShadow = true
  hips.add(torso)

  const chestGlow = new THREE.Mesh(new THREE.BoxGeometry(0.035, TORSO_HEIGHT * 0.6, 0.015), glowMat(p.glow))
  chestGlow.position.set(0, TORSO_HEIGHT / 2 + 0.03, 0.155 * bw)
  hips.add(chestGlow)

  const belt = new THREE.Mesh(new THREE.BoxGeometry(0.56 * bw, 0.07, 0.32 * bw), bodyMat(p.outfitShade))
  belt.position.y = 0.02
  hips.add(belt)

  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.1, 10), skinMat(p.skin))
  neck.position.y = TORSO_HEIGHT + 0.01
  neck.castShadow = true
  hips.add(neck)

  const makeArm = (side: 1 | -1) => {
    const pivot = new THREE.Group()
    pivot.position.set(side * SHOULDER_X, SHOULDER_Y, 0)
    const arm = limbMesh(ARM_LENGTH, 0.1 * bw, p.outfit)
    pivot.add(arm)
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.095 * bw, 10, 10), bodyMat(0x1c1c1c, 0.1, 0.6))
    glove.position.y = -ARM_LENGTH + 0.06
    glove.castShadow = true
    pivot.add(glove)
    hips.add(pivot)
    return pivot
  }
  const leftArm = makeArm(-1)
  const rightArm = makeArm(1)

  const head = new THREE.Group()
  head.position.y = TORSO_HEIGHT + 0.16
  hips.add(head)
  buildFace(head, p)
  head.add(buildHair(def.hairStyle, p))

  attachAccessory(def.accessory, hips, p)

  const parachute = buildParachuteRig()
  root.add(parachute)

  const weaponSocket = new THREE.Group()
  weaponSocket.position.set(0, SHOULDER_Y - 0.08, 0.32 * bw)
  hips.add(weaponSocket)

  return { root, hips, torso, head, leftArm, rightArm, leftLeg, rightLeg, parachute, weaponSocket }
}
