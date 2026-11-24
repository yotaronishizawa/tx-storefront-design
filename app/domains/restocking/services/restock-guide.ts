import type { SkuRecommendationCounts } from "~/api/opm/schemas"
import {
  isRestockStudy,
  STUDY_GUIDE_CABINET,
  STUDY_LANE_CAPACITY,
} from "~/config/restock-study"
import { readShelfState, selectStockBoard } from "~/domains/shelf"
import {
  findGuideTarget,
  getStockLocationSkuIds,
  planGuideLanes,
  type GuideLane,
  type LayoutCabinet,
  type ShelfLocation,
} from "~/model/shelf"

import { readRestockingState } from "../restocking-store"

/**
 * The restock study's plan for the scanned drink: which lanes to fill, in
 * order. Kept across placements so staff fill one run of lanes, and made
 * again only for a new drink or once every planned lane is full.
 */
export function ensureGuidePlan(): string[] {
  const {
    entryPlans,
    guidePlan,
    scannedSkuId,
    setGuidePlan,
    unstockableLaneIds,
  } = readRestockingState()
  if (!isRestockStudy() || !scannedSkuId) {
    return []
  }
  const shelf = readShelfState()
  const cabinets = selectStockBoard(shelf)
  if (
    guidePlan.skuId === scannedSkuId &&
    findGuideTarget(cabinets, guidePlan.laneIds, STUDY_LANE_CAPACITY)
  ) {
    return guidePlan.laneIds
  }
  // The lanes the before-entry list showed, while they still take the drink.
  const shown = entryPlans[scannedSkuId] ?? []
  if (
    guidePlan.skuId !== scannedSkuId &&
    findGuideTarget(cabinets, shown, STUDY_LANE_CAPACITY)
  ) {
    setGuidePlan({ skuId: scannedSkuId, laneIds: shown })
    return shown
  }

  const laneIds = planGuideLanes({
    cabinets: onlyGuideCabinet(cabinets),
    capacity: STUDY_LANE_CAPACITY,
    neededCount: countStillNeeded(
      scannedSkuId,
      shelf.recommendationCounts,
      shelf.stockLocations
    ),
    skuId: scannedSkuId,
    unstockableLaneIds,
  })
  setGuidePlan({ skuId: scannedSkuId, laneIds })
  return laneIds
}

/** The lane to fill now, on these lanes. */
export function findGuideTargetOn(
  cabinets: LayoutCabinet[],
  laneIds: string[]
): GuideLane | undefined {
  return findGuideTarget(cabinets, laneIds, STUDY_LANE_CAPACITY)
}

/** How many more the list asks for; a drink not on it fills one lane. */
export function countStillNeeded(
  skuId: string,
  recommendations: SkuRecommendationCounts,
  stockLocations: ShelfLocation[]
): number {
  const target = recommendations[skuId]
  if (target === undefined || !Number.isFinite(target)) {
    return STUDY_LANE_CAPACITY
  }
  const stocked = stockLocations
    .flatMap(getStockLocationSkuIds)
    .filter((id) => id === skuId).length
  return Math.max(0, target - stocked)
}

/** The cabinets the study plans in: the guide cabinet when the store has it. */
export function onlyGuideCabinet(cabinets: LayoutCabinet[]): LayoutCabinet[] {
  const guide = cabinets.filter(
    (cabinet) => cabinet.cabinet === STUDY_GUIDE_CABINET
  )
  return guide.length > 0 ? guide : cabinets
}
