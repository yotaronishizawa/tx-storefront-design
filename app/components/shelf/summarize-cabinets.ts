import type { Sku } from "~/api/opm/schemas"
import {
  countCurrentStockBySku,
  countLaneSku,
  getBoardCells,
  getLocationLaneIssue,
  isLocationUnused,
  type LayoutCabinet,
} from "~/model/shelf"

import type { CabinetSummary } from "./cabinet-tabs"

const NO_COUNTS: ReadonlyMap<string, number> = new Map()

/**
 * The cabinet tab's badges. The warning means a drink not on display; aged
 * stock shows on the lanes, not the tab.
 */
export function summarizeCabinets(
  board: LayoutCabinet[],
  skuById: Map<string, Sku>,
  {
    laneAddedCounts = NO_COUNTS,
    misplacedLaneIds,
    removalSkuId = "",
  }: {
    /** Drinks added during the open restock. */
    laneAddedCounts?: ReadonlyMap<string, number>
    misplacedLaneIds: ReadonlySet<string>
    /** The drink the operator looked up for removal; each tab counts its drinks. */
    removalSkuId?: string
  }
): Map<number, CabinetSummary> {
  const summaries = new Map<number, CabinetSummary>()
  for (const cabinet of board) {
    const cells = getBoardCells([cabinet])

    let addedCount = 0
    let hasError = false
    let hasWarning = false
    let toRemoveCount = 0
    for (const cell of cells) {
      addedCount += laneAddedCounts.get(cell.id) ?? 0
      // Unused lanes included: Remove all takes those drinks out too.
      if (cell.location) {
        toRemoveCount += countLaneSku(cell.location, removalSkuId)
      }
      if (!cell.location || isLocationUnused(cell.location)) {
        continue
      }
      hasError ||= Boolean(getLocationLaneIssue(cell.location))
      hasWarning ||= misplacedLaneIds.has(cell.location.id)
    }

    let drinkCount = 0
    for (const count of countCurrentStockBySku(cells, skuById).values()) {
      drinkCount += count
    }

    summaries.set(cabinet.cabinet, {
      addedCount,
      drinkCount,
      hasError,
      hasWarning,
      toRemoveCount,
    })
  }
  return summaries
}
