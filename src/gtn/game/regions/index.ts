import type { RegionDef } from './types'
import { businessDistrict } from './business'
import { commercialDistrict } from './commercial'
import { residentialWestDistrict } from './residentialWest'
import { industrialDistrict } from './industrial'
import { ruralWestDistrict, ruralEastDistrict } from './rural'
import { airportTerminalDistrict } from './airportTerminal'

/** Every streamed district, registered once in GameCanvas via `RegionManager.register`. The always-on core (city/beach/pier/ocean/airport) is untouched and never goes through this list. */
export const ALL_REGIONS: RegionDef[] = [
  businessDistrict,
  commercialDistrict,
  residentialWestDistrict,
  industrialDistrict,
  ruralWestDistrict,
  ruralEastDistrict,
  airportTerminalDistrict,
]
