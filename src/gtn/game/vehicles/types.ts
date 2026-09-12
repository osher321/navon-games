/**
 * One shared config shape for every ride-able vehicle. Adding a new kind
 * later means adding a mesh builder + one entry here - the controller,
 * mount/dismount and camera code stay untouched. `surface` is what tells
 * the generic mount/drive loop in GameCanvas which collider set and
 * ground/water/altitude handling applies, instead of special-casing each
 * kind by name.
 */
export type VehicleKind = 'car' | 'motorcycle' | 'jetski' | 'boat' | 'airplane' | 'balloon'
export type VehicleSurface = 'road' | 'water' | 'air'

export interface VehicleConfig {
  kind: VehicleKind
  surface: VehicleSurface
  maxSpeed: number
  reverseMaxSpeed: number
  acceleration: number
  braking: number
  drag: number
  turnRate: number
  radius: number
  cameraDistance: number
  cameraHeight: number
  cameraLookHeight: number
  mountOffset: number
  /** Where the driver's hips sit while riding, in the vehicle's own local space (forward = +Z, up = +Y). */
  seatOffsetY: number
  seatOffsetZ: number
  /** How many people the vehicle could seat - not yet used for multi-passenger logic, kept for future extension. */
  seats: number
  /** Air vehicles only: vertical speed (world units/sec) and altitude clamp. */
  climbRate?: number
  minAltitude?: number
  maxAltitude?: number
  /** Airplane only: ground speed required before climb input takes effect (a basic takeoff roll). */
  liftoffSpeed?: number
}

export const VEHICLE_CONFIGS: Record<VehicleKind, VehicleConfig> = {
  car: {
    kind: 'car',
    surface: 'road',
    maxSpeed: 13,
    reverseMaxSpeed: 5,
    acceleration: 9,
    braking: 14,
    drag: 3.2,
    turnRate: 1.9,
    radius: 1.15,
    cameraDistance: 7.5,
    cameraHeight: 3.1,
    cameraLookHeight: 1.1,
    mountOffset: 2.6,
    seatOffsetY: 0.56,
    seatOffsetZ: -0.05,
    seats: 4,
  },
  motorcycle: {
    kind: 'motorcycle',
    surface: 'road',
    maxSpeed: 16,
    reverseMaxSpeed: 4,
    acceleration: 10.5,
    braking: 12,
    drag: 2.6,
    turnRate: 2.6,
    radius: 0.55,
    cameraDistance: 5.6,
    cameraHeight: 2.4,
    cameraLookHeight: 1.0,
    mountOffset: 1.3,
    seatOffsetY: 0.74,
    seatOffsetZ: -0.15,
    seats: 2,
  },
  jetski: {
    kind: 'jetski',
    surface: 'water',
    maxSpeed: 12,
    reverseMaxSpeed: 3.5,
    acceleration: 7,
    braking: 8,
    drag: 2.0,
    turnRate: 2.1,
    radius: 0.7,
    cameraDistance: 5.2,
    cameraHeight: 2.2,
    cameraLookHeight: 0.7,
    mountOffset: 1.4,
    seatOffsetY: 0.46,
    seatOffsetZ: -0.05,
    seats: 2,
  },
  boat: {
    kind: 'boat',
    surface: 'water',
    maxSpeed: 10,
    reverseMaxSpeed: 3.5,
    acceleration: 5.5,
    braking: 6.5,
    drag: 1.6,
    turnRate: 1.2,
    radius: 1.6,
    cameraDistance: 8.5,
    cameraHeight: 3.6,
    cameraLookHeight: 1.2,
    mountOffset: 2.6,
    seatOffsetY: 0.62,
    seatOffsetZ: -0.3,
    seats: 4,
  },
  airplane: {
    kind: 'airplane',
    surface: 'air',
    maxSpeed: 22,
    reverseMaxSpeed: 0,
    acceleration: 6,
    braking: 9,
    drag: 1.1,
    turnRate: 1.0,
    radius: 2.4,
    cameraDistance: 11,
    cameraHeight: 4,
    cameraLookHeight: 1.4,
    mountOffset: 3.6,
    seatOffsetY: 0.78,
    seatOffsetZ: 0.5,
    seats: 1,
    climbRate: 6,
    minAltitude: 0,
    maxAltitude: 34,
    liftoffSpeed: 10,
  },
  balloon: {
    kind: 'balloon',
    surface: 'air',
    maxSpeed: 3.2,
    reverseMaxSpeed: 3.2,
    acceleration: 1.6,
    braking: 2.2,
    drag: 0.9,
    turnRate: 0.7,
    radius: 1.6,
    cameraDistance: 9,
    cameraHeight: 3,
    cameraLookHeight: 1.0,
    mountOffset: 2.4,
    seatOffsetY: 0.95,
    seatOffsetZ: 0,
    seats: 2,
    climbRate: 2.2,
    minAltitude: 0,
    maxAltitude: 38,
  },
}
