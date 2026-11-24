import type { Sku, SkuRecommendationCounts } from "~/api/opm/schemas"
import {
  getStudyFacingCapacity,
  STUDY_LANE_CAPACITY,
  STUDY_URGENT_DISPLAY_RATIO,
} from "~/config/restock-study"
import {
  planGuideLanes,
  type LayoutCabinet,
  type ShelfLocation,
} from "~/model/shelf"

import { countStillNeeded, onlyGuideCabinet } from "./restock-guide"

export type EntryPlanItem = {
  skuId: string
  displayRatio: number | null
  neededCount: number
  urgent: boolean
  laneIds: string[]
}

/**
 * The restock study's before-entry list: every drink the list still asks for,
 * the emptiest display shelf first, each with the lanes it goes in. Lanes go
 * to the more urgent drink first, so no two drinks are sent to the same lane.
 */
export function planEntry({
  cabinets,
  displayLocations,
  recommendations,
  skuById,
  stockLocations,
}: {
  cabinets: LayoutCabinet[]
  displayLocations: ShelfLocation[]
  recommendations: SkuRecommendationCounts
  skuById: Map<string, Sku>
  stockLocations: ShelfLocation[]
}): EntryPlanItem[] {
  const rows = Object.keys(recommendations)
    .filter((skuId) => skuById.has(skuId))
    .map((skuId) => ({
      skuId,
      neededCount: countStillNeeded(skuId, recommendations, stockLocations),
      ratio: getDisplayRatio(skuId, displayLocations, skuById.get(skuId)),
    }))
    .filter((row) => row.neededCount > 0)
    // A drink off the display shelf has no ratio and goes last.
    .sort((left, right) => (left.ratio ?? 2) - (right.ratio ?? 2))

  const taken = new Set<string>()
  return rows.map((row) => {
    const laneIds = planGuideLanes({
      cabinets: onlyGuideCabinet(cabinets),
      capacity: STUDY_LANE_CAPACITY,
      neededCount: row.neededCount,
      skuId: row.skuId,
      unstockableLaneIds: taken,
    })
    laneIds.forEach((laneId) => taken.add(laneId))
    return {
      skuId: row.skuId,
      displayRatio: row.ratio,
      neededCount: row.neededCount,
      urgent: row.ratio !== null && row.ratio < STUDY_URGENT_DISPLAY_RATIO,
      laneIds,
    }
  })
}

/** Drinks left over what its facings hold; null when it has no facing or no count. */
function getDisplayRatio(
  skuId: string,
  displayLocations: ShelfLocation[],
  sku: Sku | undefined
): number | null {
  const facings = displayLocations.filter(
    (location) =>
      location.skuId === skuId && typeof location.leftCount === "number"
  )
  if (facings.length === 0) {
    return null
  }
  const left = facings.reduce(
    (total, location) => total + Math.max(0, location.leftCount ?? 0),
    0
  )
  return left / (facings.length * getStudyFacingCapacity(sku?.volume ?? 0))
}
