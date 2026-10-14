/*
 * Editing single locations: a stuck lane put back in use, every lane switched
 * on or off together, and the shelf re-weighing a lane in discrepancy.
 */
import { findStockLocation } from "../model/lanes.mjs"
import { findActiveRequest, REQUEST_TYPE } from "../model/requests.mjs"
import { state } from "../state.mjs"
import { withErrors } from "./define.mjs"
import { FORCE_DISCREPANCY_RESOLUTION_ERRORS } from "./errors.mjs"

// `PatchLocationRequest` (`JobManager/Entities/PatchLocationRequest.cs`): only
// the fields sent are written.
const PATCHABLE_FIELDS = [
  "isAvailable",
  "skuId",
  "slot",
  "isRequiredScan",
  "isBlackList",
  "priorities",
  "isForceSetPriority",
  "unusedType",
]

// `LocationType`: 0 DisplayShelf, 1 StockShelf, by number or name.
const STOCK_SHELF = new Set([1, "StockShelf"])

export const locationMethods = {
  // `MongoDBGateway.PatchLocation`: the updated location, or `null` when the
  // location is unknown or nothing was sent.
  PatchLocation: ([, locationId, patch]) =>
    patchLocation(String(locationId ?? ""), patch ?? {}),

  // `MongoDBGateway.SwitchShelfLocationIsAvailable`: every location of one
  // shelf at once. Display locations always come back needing a scan.
  SwitchShelfLocationIsAvailable: ([, isAvailable, locationType]) => {
    const available = Boolean(isAvailable)
    if (STOCK_SHELF.has(locationType)) {
      for (const location of state.stockLocations) {
        location.isAvailable = available
        location.isRequiredScan = false
      }
    } else {
      for (const location of state.displayLocations) {
        location.isAvailable = available
      }
    }
    for (const location of state.displayLocations) {
      location.isRequiredScan = true
    }
    return true
  },

  // `CheckLaneMatched` in the store app. The shelf re-weighs the lane; what is
  // still wrong afterwards disables it (`StockSkusChanges.ForceDiscrepancyResolution`).
  ForceDiscrepancyResolution: withErrors(
    ([command]) =>
      forceDiscrepancyResolution(
        String(command?.locationId ?? command?.LocationId ?? "")
      ),
    FORCE_DISCREPANCY_RESOLUTION_ERRORS,
    (error) => ({ error, laneErrors: [], isLaneDisabled: false, skuIds: [] })
  ),
}

function patchLocation(locationId, patch) {
  const location =
    findStockLocation(locationId) ??
    state.displayLocations.find((item) => item.id === locationId)
  const fields = PATCHABLE_FIELDS.filter((field) => patch[field] != null)
  if (!location || fields.length === 0) {
    return null
  }
  for (const field of fields) {
    location[field] = patch[field]
  }
  // Taking a lane off the blacklist also clears what put it there.
  if (patch.isBlackList === false && location.errors) {
    location.errors = []
  }
  return location
}

function forceDiscrepancyResolution(locationId) {
  if (!state.shelfConnected) {
    return { error: 2, laneErrors: [], isLaneDisabled: false, skuIds: [] }
  }
  const location = findStockLocation(locationId)
  if (!location) {
    return { error: 3, laneErrors: [], isLaneDisabled: false, skuIds: [] }
  }

  // A weight discrepancy clears on re-weighing unless `/sim/lane/unfixable`
  // said otherwise; a drink too big for the lane never does.
  const unfixable = state.unfixableLaneIds.includes(locationId)
  location.errors = (location.errors ?? []).filter(
    (error) => "invalidSkuId" in error || unfixable
  )
  if (location.errors.length > 0) {
    location.isBlackList = true
    recordUnfixableLane(location)
  }
  // OPM pushes no lane change here; the app reads the answer.
  return {
    error: 0,
    laneErrors: location.errors,
    isLaneDisabled: location.errors.length > 0,
    skuIds: location.skuIds,
  }
}

/** `UnfixableLocationErrors` on the open restock or manual replenishment. */
function recordUnfixableLane(location) {
  const task =
    findActiveRequest(REQUEST_TYPE.restocking) ??
    findActiveRequest(REQUEST_TYPE.manualReplenishment)
  if (task) {
    task.unfixableLocationErrors = {
      ...task.unfixableLocationErrors,
      [location.id]: location.errors,
    }
  }
}
