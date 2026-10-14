import { findStockLocationIndex } from "./apply-lane-updates"
import type { LaneUpdate, ShelfLocation } from "./lane-update"
import { getLocationLaneErrors, getStockLocationSkuIds } from "./location"

/** Only the fields a lane update can move. */
function laneSignature(location: ShelfLocation): string {
  return [
    getStockLocationSkuIds(location).join("|"),
    location.laneEventType ?? "",
    getLocationLaneErrors(location).length,
  ].join("::")
}

/**
 * Compares by value: `applyLaneUpdatesToLocations` rebuilds every lane it
 * touches, so a replayed snapshot would otherwise always look like a change.
 */
export function hasStockShelfLaneChange(
  previousLocations: ShelfLocation[],
  nextLocations: ShelfLocation[]
): boolean {
  if (previousLocations === nextLocations) {
    return false
  }

  if (previousLocations.length !== nextLocations.length) {
    return true
  }

  return previousLocations.some((location, index) => {
    const next = nextLocations[index]
    return location !== next && laneSignature(location) !== laneSignature(next)
  })
}

/** Any lane event but a snapshot, when it names a lane. */
export function isRestockingLaneFocusUpdate(update: LaneUpdate): boolean {
  return (
    update.laneEventType !== "SnapShot" &&
    (Boolean(update.locationId) || update.hardwareCellIndex >= 0)
  )
}

export function getStockShelfLaneUpdateLocationId(
  update: LaneUpdate,
  stockLocations: ShelfLocation[]
): string {
  if (update.locationId) {
    return update.locationId
  }
  return (
    stockLocations[findStockLocationIndex(stockLocations, update)]?.id ?? ""
  )
}

/**
 * Net drink change per lane between two snapshots; unchanged lanes are left out.
 *
 * @example countLaneChanges([{ id: "s1", skuIds: ["a"] }], [{ id: "s1", skuIds: [] }]) // Map { "s1" => -1 }
 */
export function countLaneChanges(
  previousLocations: ShelfLocation[],
  nextLocations: ShelfLocation[]
): Map<string, number> {
  const previousCounts = new Map<string, number>()
  for (const location of previousLocations) {
    previousCounts.set(location.id, getStockLocationSkuIds(location).length)
  }

  const changes = new Map<string, number>()
  for (const location of nextLocations) {
    const previous = previousCounts.get(location.id)
    const change = getStockLocationSkuIds(location).length - (previous ?? 0)
    if (change !== 0 && previous !== undefined) {
      changes.set(location.id, change)
    }
  }
  return changes
}

/**
 * Rebuilds, from two polled snapshots, the lane updates the local hub would
 * have sent, since OPM polling only delivers whole snapshots.
 */
export function buildPolledLaneUpdates(
  previousLocations: ShelfLocation[],
  nextLocations: ShelfLocation[]
): LaneUpdate[] {
  const previousByKey = new Map<string, ShelfLocation>()
  for (const location of previousLocations) {
    const key = getStockLocationComparisonKey(location)
    if (key) {
      previousByKey.set(key, location)
    }
  }

  const updates: LaneUpdate[] = []
  for (const location of nextLocations) {
    const key = getStockLocationComparisonKey(location)
    // `""` is never a key, so a lane with no id or cell is skipped.
    const previous = previousByKey.get(key)
    if (!previous) {
      continue
    }

    const previousSkuIds = getStockLocationSkuIds(previous)
    const nextSkuIds = getStockLocationSkuIds(location)
    const skuCountDiff = nextSkuIds.length - previousSkuIds.length
    const errorsInfo = getLocationLaneErrors(location)
    const hadErrors = getLocationLaneErrors(previous).length > 0
    const hasErrors = errorsInfo.length > 0
    const skuIdsChanged = !areStringArraysEqual(previousSkuIds, nextSkuIds)
    if (!skuIdsChanged && hadErrors === hasErrors) {
      continue
    }

    updates.push({
      changedSkuId:
        skuCountDiff > 0
          ? findExtraSkuId(nextSkuIds, previousSkuIds)
          : undefined,
      errorsInfo,
      eventId: `opm-poll:${key}:${nextSkuIds.join(",")}:${hasErrors}`,
      hardwareCellIndex: location.hardwareCellIndex ?? -1,
      laneEventType: getPolledLaneEventType(skuCountDiff, hasErrors),
      locationId: location.id,
      skuIds: nextSkuIds,
    })
  }
  return updates
}

function getPolledLaneEventType(
  skuCountDiff: number,
  hasErrors: boolean
): LaneUpdate["laneEventType"] {
  if (skuCountDiff > 0) {
    return "Add"
  }
  if (skuCountDiff < 0) {
    return "Remove"
  }
  return hasErrors ? "Error" : "Fix"
}

/** Matches a lane across snapshots by id, else by hardware cell; `""` when neither is known. */
function getStockLocationComparisonKey(location: ShelfLocation): string {
  if (location.id) {
    return `location:${location.id}`
  }

  const hardwareCellIndex = location.hardwareCellIndex ?? -1
  return hardwareCellIndex >= 0 ? `hardware:${hardwareCellIndex}` : ""
}

function areStringArraysEqual(left: string[], right: string[]): boolean {
  return (
    left.length === right.length &&
    left.every((item, index) => item === right[index])
  )
}

/** The first id in `skuIds` with more copies than in `baseline`, or `""`. */
export function findExtraSkuId(skuIds: string[], baseline: string[]): string {
  const counts = new Map<string, number>()
  for (const skuId of baseline) {
    counts.set(skuId, (counts.get(skuId) ?? 0) + 1)
  }
  for (const skuId of skuIds) {
    const count = counts.get(skuId) ?? 0
    if (count === 0) {
      return skuId
    }
    counts.set(skuId, count - 1)
  }
  return ""
}
