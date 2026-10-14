import type { ShelfLocation } from "./lane-update"
import { getLocationSkuId } from "./location"

function editableLocation(location: ShelfLocation) {
  return {
    skuId: getLocationSkuId(location),
    x: location.slot?.posX ?? location.slot?.x,
    y: location.slot?.posY,
    z: location.slot?.posZ ?? location.slot?.z,
    disabled: Boolean(location.isBlackList),
  }
}

/** Stale-base detection includes identity and excludes changing telemetry. */
export function displayLayoutIdentity(locations: ShelfLocation[]): string {
  return JSON.stringify(
    locations
      .map((location) => ({ id: location.id, ...editableLocation(location) }))
      .sort((left, right) => left.id.localeCompare(right.id))
  )
}

/** OPM assigns destination_id_ GUIDs to newly inserted faces. Compare the
 * submitted shelf contents as a multiset, without treating those IDs as edits. */
export function displayLayoutContents(locations: ShelfLocation[]): string {
  return JSON.stringify(
    locations
      .map((location) => JSON.stringify(editableLocation(location)))
      .sort()
  )
}
