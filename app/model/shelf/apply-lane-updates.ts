import type { LaneUpdate, ShelfLocation } from "./lane-update"
import { alignSkuEntries, alignSkuEntriesByPosition } from "./location"

export function applyLaneUpdatesToLocations(
  locations: ShelfLocation[],
  updates: LaneUpdate[]
): ShelfLocation[] {
  if (updates.length === 0 || locations.length === 0) {
    return locations
  }

  let nextLocations = locations

  for (const update of updates) {
    const locationIndex = findStockLocationIndex(nextLocations, update)
    if (locationIndex < 0) {
      continue
    }

    if (nextLocations === locations) {
      nextLocations = locations.slice()
    }

    nextLocations[locationIndex] = applyLaneUpdate(
      nextLocations[locationIndex],
      update
    )
  }

  return nextLocations
}

function applyLaneUpdate(
  location: ShelfLocation,
  update: LaneUpdate
): ShelfLocation {
  return {
    ...location,
    // OPM's updates carry no hardware cell, and write -1 for it.
    hardwareCellIndex:
      update.hardwareCellIndex >= 0
        ? update.hardwareCellIndex
        : location.hardwareCellIndex,
    laneErrors: update.errorsInfo ?? location.laneErrors,
    laneEventType: update.laneEventType,
    skuEntries: alignLaneSkuEntries(location, update),
    skuId: update.skuIds[0] ?? "",
    skuIds: update.skuIds,
  }
}

/**
 * OPM's dates when they cover every drink. Otherwise (the local hub sends none)
 * the lane's own dates follow their drinks the way OPM will store them, and a
 * drink just added counts from now rather than showing as unknown.
 */
function alignLaneSkuEntries(location: ShelfLocation, update: LaneUpdate) {
  if (update.skuEntries?.length === update.skuIds.length) {
    return alignSkuEntriesByPosition(update.skuIds, update.skuEntries)
  }
  return alignSkuEntries(
    update.skuIds,
    location.skuEntries ?? [],
    update.laneEventType === "Add" ? new Date().toISOString() : undefined
  )
}

/** The lane an update names: by id, else by hardware cell; -1 when neither matches. */
export function findStockLocationIndex(
  locations: ShelfLocation[],
  update: LaneUpdate
): number {
  if (update.locationId) {
    const byLocationId = locations.findIndex(
      (location) => location.id === update.locationId
    )
    if (byLocationId >= 0) {
      return byLocationId
    }
  }

  if (update.hardwareCellIndex >= 0) {
    return locations.findIndex(
      (location) => location.hardwareCellIndex === update.hardwareCellIndex
    )
  }

  return -1
}
