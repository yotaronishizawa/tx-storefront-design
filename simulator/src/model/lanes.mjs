/*
 * Stock lanes: the mutations the RPC methods and `/sim/*` helpers share, and
 * the shapes OPM sends a lane in.
 */
import { state } from "../state.mjs"
import { randomUUID } from "../utils/id.mjs"
import { nowIso } from "../utils/time.mjs"

export function findStockLocation(id) {
  return state.stockLocations.find((item) => item.id === id)
}

/** Puts a drink at the front of a lane, dated now. */
export function prependDrink(location, skuId) {
  location.skuIds = [skuId, ...location.skuIds]
  location.skuEntries = [
    { skuId, addedAt: nowIso() },
    ...(location.skuEntries ?? []),
  ]
  location.skuId = skuId
}

/** Takes `count` drinks off the front of a lane; returns how many came off. */
export function takeDrinks(location, count) {
  const taken = Math.min(count, location.skuIds.length)
  location.skuIds = location.skuIds.slice(taken)
  location.skuEntries = (location.skuEntries ?? []).slice(taken)
  location.skuId = location.skuIds[0] ?? ""
  return taken
}

/*
 * A drink too big for its lane: OPM's `InvalidSkuError`. `InvalidSkuReason` is
 * 1 IncompatibleWidth, 2 IncompatibleHeight. The drink goes in only once, so
 * repeating the scenario changes the reason without growing the lane.
 * Returns whether the drink was added.
 */
export function putOversizedDrink(location, skuId, reason) {
  const added = location.skuIds[0] !== skuId
  if (added) {
    prependDrink(location, skuId)
  }
  location.errors = [
    { id: randomUUID(), invalidSkuId: skuId, reasons: [reason] },
  ]
  return added
}

/*
 * A weight the shelf cannot explain: OPM's `DiscrepancyError`. `DiscrepancyCause`
 * is an index into `DISCREPANCY_CAUSE_NAMES` (`model/shelf-hub.mjs`); any other
 * integer exercises the app's unknown-code fallback.
 */
export function putWeightDiscrepancy(location, cause) {
  location.errors = [
    { id: randomUUID(), cause, expectedWeight: 500, actualWeight: 380 },
  ]
}

/** Drops every lane error, so the board can be driven back to clean without a full reset. */
export function clearLaneErrors() {
  const updates = []
  for (const location of state.stockLocations) {
    if (!location.errors?.length) {
      continue
    }
    location.errors = []
    updates.push(toStockSkuChange(location, { skuCountDiff: 0 }))
  }
  return updates
}

// `skuIds` is the lane's contents after the event, matching OPM's
// `AddedOrRemovedSku.SkuIds`. Callers mutate `location` before calling in.
export function toStockSkuChange(location, change) {
  return {
    eventId: randomUUID(),
    restockingSessionId: state.currentRestockingId,
    locationId: location.id,
    skuCount: location.skuIds.length,
    skuIds: location.skuIds,
    skuEntries: location.skuEntries ?? [],
    errors: location.errors,
    // Grams on the lane after the change; the simulator does not weigh drinks.
    weight: 0,
    ...change,
  }
}

/** One lane in `SubscribeToStockSkuChanges`' `allLocationsStates`. */
export function toRestockingLocationState(location) {
  return {
    locationId: location.id,
    skuIds: location.skuIds,
    skuEntries: location.skuEntries ?? [],
    skuCount: location.skuIds.length,
    errors: location.errors,
  }
}
