import type { InteriorBuild, BuildingKind } from './types'
import { buildHouseInterior } from './houseInterior'
import { buildSupermarketInterior } from './supermarket'
import { buildClothingStoreInterior } from './clothingStore'
import { buildGunStoreInterior } from './gunStore'
import { buildCarDealershipInterior } from './carDealership'
import { buildGenericLobbyInterior } from './genericLobby'

/**
 * The single place that turns a building's `interiorId` (kind + seed,
 * e.g. "house:7") into an actual `InteriorBuild` - GameCanvas calls this
 * exactly once, the instant the player presses E at a door, and disposes
 * the result the instant they leave. No interior ever exists in memory
 * for longer than the player is actually standing inside it, which is the
 * whole "interior streaming" strategy: with dozens of enterable buildings
 * in the city, building all of them up front would be wasteful and slow,
 * so none of them are built until the one door the player opens.
 */
export function buildInteriorFromId(interiorId: string): InteriorBuild {
  const sep = interiorId.indexOf(':')
  const kind = (sep === -1 ? interiorId : interiorId.slice(0, sep)) as BuildingKind
  const seed = sep === -1 ? 0 : parseInt(interiorId.slice(sep + 1), 10) || 0

  switch (kind) {
    case 'house':
      return buildHouseInterior(seed)
    case 'apartments':
      // Forces the "apartment building" lobby+stairwell house style
      // (index 7 of HOUSE_STYLES) regardless of the raw seed, since
      // apartment towers should always read as a shared building, not a
      // single-family layout.
      return buildHouseInterior(seed * 8 + 7)
    case 'supermarket':
      return buildSupermarketInterior(seed)
    case 'clothing':
      return buildClothingStoreInterior(seed)
    case 'gunshop':
      return buildGunStoreInterior(seed)
    case 'cardealer':
      return buildCarDealershipInterior(seed)
    case 'office':
    case 'genericShop':
    default:
      return buildGenericLobbyInterior(seed)
  }
}
