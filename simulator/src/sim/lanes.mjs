import {
  CONSTRAINT_ERROR_LANE_ID,
  DEFAULT_LANE_ID,
  DISCREPANCY_ERROR_LANE_ID,
} from "../config.mjs"
import { publishStockSkuChanges } from "../events.mjs"
import {
  clearLaneErrors,
  findStockLocation,
  prependDrink,
  putOversizedDrink,
  putWeightDiscrepancy,
  takeDrinks,
  toStockSkuChange,
} from "../model/lanes.mjs"
import { state } from "../state.mjs"
import { readIntParam } from "../utils/params.mjs"
import { post } from "./route.mjs"

export const laneRoutes = [
  post("/sim/lane/add", (params) =>
    withLane(params, DEFAULT_LANE_ID, (location) => {
      // Default: the drink scanned for the current restock, else the lane's front drink.
      const skuId =
        params.get("sku") ||
        state.currentRestockingSku ||
        location.skuIds[0] ||
        state.skus[0].id
      prependDrink(location, skuId)
      // OPM names the drink only when a scan is current; without one the app
      // reads the add as an unscanned drink.
      const scanned = params.get("scanned") !== "false"
      return toStockSkuChange(location, {
        changedSkuId: scanned ? skuId : "",
        skuCountDiff: 1,
      })
    })
  ),
  post("/sim/lane/remove", (params) =>
    withLane(params, DEFAULT_LANE_ID, (location) => {
      const requested = Math.max(1, readIntParam(params, "count", 1))
      const removedSkuIds = location.skuIds.slice(0, requested)
      const taken = takeDrinks(location, requested)
      // `RemovedSku` also names what came off.
      return toStockSkuChange(location, {
        skuCountDiff: -taken,
        removedSkuIds,
      })
    })
  ),
  post("/sim/scenario/stock-error", (params) =>
    withLane(params, DISCREPANCY_ERROR_LANE_ID, (location) => {
      putWeightDiscrepancy(location, readIntParam(params, "cause", 1))
      return toStockSkuChange(location, { skuCountDiff: 0 })
    })
  ),
  post("/sim/scenario/constraint-error", (params) =>
    withLane(params, CONSTRAINT_ERROR_LANE_ID, (location) => {
      const skuId = state.skus[state.skus.length - 2].id
      const reason = readIntParam(params, "reason", 1)
      const added = putOversizedDrink(location, skuId, reason)
      return toStockSkuChange(location, {
        changedSkuId: skuId,
        skuCountDiff: added ? 1 : 0,
      })
    })
  ),
  // Whether the lane's discrepancy survives `ForceDiscrepancyResolution`.
  post("/sim/lane/unfixable", (params) => {
    const laneId = params.get("lane") || DISCREPANCY_ERROR_LANE_ID
    if (!findStockLocation(laneId)) {
      return { ok: false, error: `Unknown lane ${laneId}` }
    }
    const others = state.unfixableLaneIds.filter((id) => id !== laneId)
    state.unfixableLaneIds =
      params.get("value") === "false" ? others : [...others, laneId]
    return { ok: true, unfixableLaneIds: state.unfixableLaneIds }
  }),
  // A drink the robot could not grip: OPM turns the lane off and marks why
  // (`StockHiccupType` 20 FarStuck, 30 NearStuck). `PatchLocation` turns it back on.
  post("/sim/lane/stuck", (params) => {
    const laneId = params.get("lane") || DEFAULT_LANE_ID
    const location = findStockLocation(laneId)
    if (!location) {
      return { ok: false, error: `Unknown lane ${laneId}` }
    }
    location.isAvailable = false
    location.hiccup = readIntParam(params, "hiccup", 30)
    return { ok: true, lane: laneId, skuId: location.skuId }
  }),
  post("/sim/scenario/clear-errors", () => {
    const updates = clearLaneErrors()
    publishStockSkuChanges(updates)
    return { ok: true, cleared: updates.length }
  }),
]

/*
 * Runs `change` on the stock lane named by `?lane=` (or `fallback`), pushes
 * what it returns, and answers with it. An unknown lane answers `400`.
 */
function withLane(params, fallback, change) {
  const laneId = params.get("lane") || fallback
  const location = findStockLocation(laneId)
  if (!location) {
    return { ok: false, error: `Unknown lane ${laneId}` }
  }
  const update = change(location)
  publishStockSkuChanges([update])
  return { ok: true, update }
}
