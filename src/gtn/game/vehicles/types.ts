/**
 * One shared config shape for every ride-able vehicle. Adding a new kind
 * later (boat, helicopter, plane) means adding a mesh builder + one entry
 * here - the controller, mount/dismount and camera code stay untouched.
 */
export type VehicleKind = 'car' | 'motorcycle' | 'jetski'

export interface VehicleConfig {
  kind: VehicleKind
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
}

export const VEHICLE_CONFIGS: Record<VehicleKind, VehicleConfig> = {
  car: {
    kind: 'car',
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
  },
  motorcycle: {
    kind: 'motorcycle',
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
  },
  jetski: {
    kind: 'jetski',
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
  },
}
