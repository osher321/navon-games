import * as THREE from 'three'
import { PITCH } from './types'

/**
 * A single canvas-drawn texture for the whole pitch (grass + white line
 * markings), instead of a tiling material plus dozens of separate line
 * meshes - one draw call for the entire playing surface, matching the
 * canvas-texture technique GTN's textures.ts already established for
 * surfaces, but sized to this pitch's exact proportions since the lines
 * (penalty box, center circle, goal box) live at fixed positions rather
 * than repeating.
 */
function buildPitchTexture(): THREE.CanvasTexture {
  const w = 1024
  const h = Math.round((w * PITCH.length) / (PITCH.halfWidth * 2))
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  const ctx = c.getContext('2d')!

  // Mown-stripe grass base.
  const stripes = 12
  for (let i = 0; i < stripes; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#3f9a46' : '#379040'
    ctx.fillRect(0, Math.round((i / stripes) * h), w, Math.ceil(h / stripes) + 1)
  }

  const toPx = (x: number, z: number) => [((x + PITCH.halfWidth) / (PITCH.halfWidth * 2)) * w, (z / PITCH.length) * h] as const

  ctx.strokeStyle = 'rgba(255,255,255,0.92)'
  ctx.lineWidth = Math.max(2, w * 0.004)

  // Outer boundary.
  const [x0, z0] = toPx(-PITCH.halfWidth, 0)
  const [x1, z1] = toPx(PITCH.halfWidth, PITCH.length)
  ctx.strokeRect(x0, z0, x1 - x0, z1 - z0)

  // Halfway line + center circle.
  const [, midZ] = toPx(0, PITCH.length / 2)
  ctx.beginPath()
  ctx.moveTo(x0, midZ)
  ctx.lineTo(x1, midZ)
  ctx.stroke()
  const [cx, cz] = toPx(0, PITCH.length / 2)
  ctx.beginPath()
  ctx.arc(cx, cz, w * 0.06, 0, Math.PI * 2)
  ctx.stroke()

  // Penalty box + goal box + spot, at the attacking (far) end only - the
  // camera never shows the other end in any mode, so drawing it there too
  // would be wasted detail.
  const boxHalf = PITCH.goalHalfWidth + 5
  const [bx0, bz0] = toPx(-boxHalf, PITCH.length - 16)
  const [bx1, bz1] = toPx(boxHalf, PITCH.length)
  ctx.strokeRect(bx0, bz0, bx1 - bx0, bz1 - bz0)
  const smallHalf = PITCH.goalHalfWidth + 1.8
  const [sx0, sz0] = toPx(-smallHalf, PITCH.length - 6)
  const [sx1, sz1] = toPx(smallHalf, PITCH.length)
  ctx.strokeRect(sx0, sz0, sx1 - sx0, sz1 - sz0)
  const [spotX, spotZ] = toPx(0, PITCH.penaltySpotZ)
  ctx.fillStyle = 'rgba(255,255,255,0.92)'
  ctx.beginPath()
  ctx.arc(spotX, spotZ, w * 0.006, 0, Math.PI * 2)
  ctx.fill()

  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

/** A small, original crest-like roundel pattern for the decorative ad boards - an abstract star-in-circle mark, not any real club/brand logo. */
function buildAdBoardTexture(hue: number): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 128
  const ctx = c.getContext('2d')!
  ctx.fillStyle = `hsl(${hue} 70% 32%)`
  ctx.fillRect(0, 0, 512, 128)
  ctx.fillStyle = `hsl(${hue} 80% 55%)`
  for (let i = 0; i < 4; i++) {
    const cx = 64 + i * 128
    ctx.beginPath()
    ctx.arc(cx, 64, 34, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = `hsl(${hue} 70% 32%)`
    ctx.beginPath()
    ctx.moveTo(cx, 40)
    for (let p = 1; p < 5; p++) {
      const ang = (p / 5) * Math.PI * 2 - Math.PI / 2
      ctx.lineTo(cx + Math.cos(ang) * 16, 64 + Math.sin(ang) * 16)
    }
    ctx.closePath()
    ctx.fill()
    ctx.fillStyle = `hsl(${hue} 80% 55%)`
  }
  ctx.font = 'bold 40px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('NAVON ARENA', 256, 64)
  const tex = new THREE.CanvasTexture(c)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function buildNetTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas')
  c.width = 128
  c.height = 128
  const ctx = c.getContext('2d')!
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'
  ctx.lineWidth = 2
  for (let i = 0; i <= 8; i++) {
    const p = (i / 8) * 128
    ctx.beginPath()
    ctx.moveTo(p, 0)
    ctx.lineTo(p, 128)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(0, p)
    ctx.lineTo(128, p)
    ctx.stroke()
  }
  const tex = new THREE.CanvasTexture(c)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  return tex
}

export interface Stadium {
  group: THREE.Group
  /** Static colliders for the goal frame (posts + crossbar) - a shot that touches one deflects instead of scoring. */
  postColliders: { start: THREE.Vector3; end: THREE.Vector3; radius: number }[]
}

/** Builds the whole original stadium (pitch, goal, stands, crowd, floodlights, scoreboard, ad boards) as one group - every piece is procedural geometry/canvas textures, nothing borrowed from any real club or existing game. */
export function buildStadium(): Stadium {
  const group = new THREE.Group()

  const pitchTex = buildPitchTexture()
  const pitch = new THREE.Mesh(
    new THREE.PlaneGeometry(PITCH.halfWidth * 2, PITCH.length),
    new THREE.MeshStandardMaterial({ map: pitchTex, roughness: 0.95 })
  )
  pitch.rotation.x = -Math.PI / 2
  pitch.position.set(0, 0, PITCH.length / 2)
  pitch.receiveShadow = true
  group.add(pitch)

  // ----- Goal frame -----
  const postMat = new THREE.MeshStandardMaterial({ color: 0xf6f8fa, roughness: 0.35, metalness: 0.15 })
  const postRadius = 0.09
  const postColliders: Stadium['postColliders'] = []
  const goalY = PITCH.goalHeight
  ;[-PITCH.goalHalfWidth, PITCH.goalHalfWidth].forEach((x) => {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, goalY, 10), postMat)
    post.position.set(x, goalY / 2, PITCH.goalZ)
    post.castShadow = true
    group.add(post)
    postColliders.push({ start: new THREE.Vector3(x, 0, PITCH.goalZ), end: new THREE.Vector3(x, goalY, PITCH.goalZ), radius: postRadius })
  })
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(postRadius, postRadius, PITCH.goalHalfWidth * 2 + postRadius * 2, 10), postMat)
  bar.rotation.z = Math.PI / 2
  bar.position.set(0, goalY, PITCH.goalZ)
  bar.castShadow = true
  group.add(bar)
  postColliders.push({
    start: new THREE.Vector3(-PITCH.goalHalfWidth, goalY, PITCH.goalZ),
    end: new THREE.Vector3(PITCH.goalHalfWidth, goalY, PITCH.goalZ),
    radius: postRadius,
  })

  // Net: back + two side panels, all one shared translucent texture/material.
  const netTex = buildNetTexture()
  netTex.repeat.set(4, 2)
  const netMat = new THREE.MeshBasicMaterial({ map: netTex, transparent: true, side: THREE.DoubleSide, opacity: 0.9 })
  const netDepth = 2.2
  const backNet = new THREE.Mesh(new THREE.PlaneGeometry(PITCH.goalHalfWidth * 2, goalY), netMat)
  backNet.position.set(0, goalY / 2, PITCH.goalZ + netDepth)
  group.add(backNet)
  const sideNetGeo = new THREE.PlaneGeometry(netDepth, goalY)
  const leftNet = new THREE.Mesh(sideNetGeo, netMat)
  leftNet.rotation.y = Math.PI / 2
  leftNet.position.set(-PITCH.goalHalfWidth, goalY / 2, PITCH.goalZ + netDepth / 2)
  group.add(leftNet)
  const rightNet = new THREE.Mesh(sideNetGeo, netMat)
  rightNet.rotation.y = Math.PI / 2
  rightNet.position.set(PITCH.goalHalfWidth, goalY / 2, PITCH.goalZ + netDepth / 2)
  group.add(rightNet)
  const topNet = new THREE.Mesh(new THREE.PlaneGeometry(PITCH.goalHalfWidth * 2, netDepth), netMat)
  topNet.rotation.x = Math.PI / 2
  topNet.position.set(0, goalY, PITCH.goalZ + netDepth / 2)
  group.add(topNet)

  // ----- Stands + crowd (one InstancedMesh for hundreds of spectators = one draw call) -----
  const standMat = new THREE.MeshStandardMaterial({ color: 0x8892a6, roughness: 0.9 })
  const standDepth = 10
  const standHeight = 9
  const standOffsets: [number, number, number][] = [
    [0, standHeight / 2, -standDepth / 2 - 4],
    [0, standHeight / 2, PITCH.length + standDepth / 2 + 4],
  ]
  standOffsets.forEach(([x, y, z]) => {
    const stand = new THREE.Mesh(new THREE.BoxGeometry(PITCH.halfWidth * 2 + 16, standHeight, standDepth), standMat)
    stand.position.set(x, y, z)
    stand.castShadow = true
    stand.receiveShadow = true
    group.add(stand)
  })
  const sideStandDepth = PITCH.length + 12
  ;[-PITCH.halfWidth - 8, PITCH.halfWidth + 8].forEach((x) => {
    const stand = new THREE.Mesh(new THREE.BoxGeometry(8, standHeight, sideStandDepth), standMat)
    stand.position.set(x, standHeight / 2, PITCH.length / 2)
    stand.castShadow = true
    stand.receiveShadow = true
    group.add(stand)
  })

  const CROWD_COUNT = 420
  const crowdGeo = new THREE.CapsuleGeometry(0.22, 0.5, 3, 5)
  const crowdMat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8 })
  const crowd = new THREE.InstancedMesh(crowdGeo, crowdMat, CROWD_COUNT)
  const crowdColors = new Float32Array(CROWD_COUNT * 3)
  const dummy = new THREE.Object3D()
  const palette = [0xe94f4f, 0xf2c14e, 0x3fa7d6, 0x59c9a5, 0xf4989c, 0xffffff]
  let placed = 0
  const rowsBack = 4
  for (let row = 0; row < rowsBack && placed < CROWD_COUNT; row++) {
    const rowY = 3.4 + row * 1.7
    const rowZOffsetNorth = -standDepth / 2 - 4 - row * 1.3
    const rowZOffsetSouth = PITCH.length + standDepth / 2 + 4 + row * 1.3
    const seatsPerRow = 26
    for (let i = 0; i < seatsPerRow && placed < CROWD_COUNT; i++) {
      const x = -PITCH.halfWidth - 6 + (i / (seatsPerRow - 1)) * (PITCH.halfWidth * 2 + 12)
      for (const z of [rowZOffsetNorth, rowZOffsetSouth]) {
        if (placed >= CROWD_COUNT) break
        dummy.position.set(x + (Math.random() - 0.5) * 0.6, rowY, z)
        dummy.rotation.y = Math.random() * Math.PI * 2
        dummy.updateMatrix()
        crowd.setMatrixAt(placed, dummy.matrix)
        const color = new THREE.Color(palette[Math.floor(Math.random() * palette.length)])
        color.toArray(crowdColors, placed * 3)
        placed++
      }
    }
  }
  crowd.instanceColor = new THREE.InstancedBufferAttribute(crowdColors, 3)
  crowd.castShadow = false
  group.add(crowd)

  // ----- Floodlights -----
  ;[
    [-PITCH.halfWidth - 6, 4],
    [PITCH.halfWidth + 6, 4],
    [-PITCH.halfWidth - 6, PITCH.length - 4],
    [PITCH.halfWidth + 6, PITCH.length - 4],
  ].forEach(([x, z]) => {
    const poleH = 16
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.3, poleH, 8), standMat)
    pole.position.set(x, poleH / 2, z)
    pole.castShadow = true
    group.add(pole)
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(2.2, 1.2, 0.5), new THREE.MeshBasicMaterial({ color: 0xfff7dd }))
    lamp.position.set(x, poleH + 0.4, z)
    group.add(lamp)
    const light = new THREE.PointLight(0xfff2cf, 0.6, 45, 2)
    light.position.set(x, poleH, z)
    group.add(light)
  })

  // ----- Scoreboard -----
  const boardTex = (() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 256
    const ctx = c.getContext('2d')!
    ctx.fillStyle = '#0c1220'
    ctx.fillRect(0, 0, 512, 256)
    ctx.fillStyle = '#37d67a'
    ctx.font = 'bold 46px monospace'
    ctx.textAlign = 'center'
    ctx.fillText('⚽ SOCCER', 256, 90)
    ctx.fillStyle = '#ffd23f'
    ctx.font = 'bold 30px monospace'
    ctx.fillText('CHALLENGE', 256, 140)
    ctx.strokeStyle = '#37d67a'
    ctx.lineWidth = 6
    ctx.strokeRect(10, 10, 492, 236)
    const t = new THREE.CanvasTexture(c)
    t.colorSpace = THREE.SRGBColorSpace
    return t
  })()
  const board = new THREE.Mesh(new THREE.BoxGeometry(10, 5, 0.4), new THREE.MeshBasicMaterial({ map: boardTex }))
  board.position.set(0, standHeight + 3, -standDepth / 2 - 4)
  group.add(board)

  // ----- Decorative original ad boards along the touchlines -----
  const hues = [200, 20, 320, 100]
  hues.forEach((hue, i) => {
    const tex = buildAdBoardTexture(hue)
    const board2 = new THREE.Mesh(new THREE.BoxGeometry(10, 1.4, 0.15), new THREE.MeshBasicMaterial({ map: tex }))
    board2.position.set(-PITCH.halfWidth - 0.6 - (i % 2) * 0, 0.9, 8 + i * 14)
    board2.rotation.y = Math.PI / 2
    group.add(board2)
    const board3 = board2.clone()
    board3.material = new THREE.MeshBasicMaterial({ map: buildAdBoardTexture(hue + 40) })
    board3.position.set(PITCH.halfWidth + 0.6, 0.9, 8 + i * 14)
    board3.rotation.y = -Math.PI / 2
    group.add(board3)
  })

  return { group, postColliders }
}
