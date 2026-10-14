import {
  StockHiccupType,
  type JobResultStatusName,
  type OpmShelfLocation,
  type TeleopErrorCodeName,
} from "~/api/opm/schemas"

const STUCK_HICCUPS: ReadonlySet<unknown> = new Set([
  StockHiccupType.NearStuck,
  StockHiccupType.FarStuck,
  "NearStuck",
  "FarStuck",
])

const STUCK_AT_STOCK_ERRORS: ReadonlySet<string> = new Set<TeleopErrorCodeName>(
  ["NearStuckStock", "FarStuckStock", "NearStuck", "FarStuck"]
)

/**
 * The stock lanes holding `skuId` that OPM turned off because the robot could
 * not pick from them. The hiccup outlives the lane being turned back on, so
 * both marks must be there.
 *
 * @example findStuckStockLanes([{ id: "s1", skuId: "tea", isAvailable: false, hiccup: 30 }], "tea") // ["s1"]
 * @example findStuckStockLanes([{ id: "s1", skuId: "tea", isAvailable: true, hiccup: 30 }], "tea") // []
 */
export function findStuckStockLanes(
  stockLocations: OpmShelfLocation[],
  skuId: string
): string[] {
  if (!skuId) {
    return []
  }
  return stockLocations
    .filter(
      (lane) =>
        lane.skuId === skuId &&
        !lane.isBlackList &&
        lane.isAvailable === false &&
        STUCK_HICCUPS.has(lane.hiccup)
    )
    .map((lane) => lane.id)
}

/**
 * A job the robot finished with a drink stuck in the stock lane. A job that
 * aged out of the queue has no final status, so it never matches.
 *
 * @example isStuckAtStockOutcome({ currentStatus: "Cancelled", errorCode: "FarStuckStock" }) // true
 * @example isStuckAtStockOutcome({ currentStatus: "Processing", errorCode: "FarStuckStock" }) // false
 */
export function isStuckAtStockOutcome(outcome: {
  currentStatus?: JobResultStatusName
  errorCode?: TeleopErrorCodeName
}): boolean {
  const finished =
    outcome.currentStatus === "Completed" ||
    outcome.currentStatus === "Cancelled"
  return finished && STUCK_AT_STOCK_ERRORS.has(outcome.errorCode ?? "")
}
