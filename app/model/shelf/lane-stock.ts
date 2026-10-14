import type {
  Sku,
  SkuRecommendationCounts,
  StockExpiryWarning,
} from "~/api/opm/schemas"
import { isPlaceholderSku } from "~/model/sku"
import { getDaysSince } from "~/utils/date"

import type { LayoutCabinet, LayoutCell } from "./board"
import { getBoardCells } from "./cells"
import {
  getStockLocationSkuEntries,
  getStockLocationSkuIds,
  isLocationBlocked,
  isLocationUnused,
} from "./location"

export type RestockingPlacementState = {
  compatibilityKnown: boolean
  scannedSkuId: string
  unstockableLaneIds: Set<string>
}

export type RecommendationRow = {
  currentCount: number
  neededCount: number
  recommendationCount: number
  sku?: Sku
  skuId: string
}

/** One drink in a lane, front first. */
export type LaneDrink = {
  addedAt: string | null
  position: number
  sku?: Sku
  skuId: string
  /** Index in the lane's `skuIds`, which is what OPM removes by. */
  skuIndex: number
}

export type AgedStockRule = Pick<StockExpiryWarning, "thresholdDays">

export function createRecommendationRows(
  recommendations: SkuRecommendationCounts,
  cells: LayoutCell[],
  skuById: Map<string, Sku>
): RecommendationRow[] {
  const currentCounts = countCurrentStockBySku(cells, skuById)

  // A drink the catalogue lacks is not listed.
  return Object.entries(recommendations)
    .filter(([skuId]) => skuById.has(skuId))
    .map(([skuId, rawCount]) => {
      const recommendationCount = toWholeCount(rawCount)
      const currentCount = currentCounts.get(skuId) ?? 0

      return {
        currentCount,
        neededCount: Math.max(0, recommendationCount - currentCount),
        recommendationCount,
        sku: skuById.get(skuId),
        skuId,
      }
    })
}

/** A non-negative whole number; anything that is not a number reads as 0. */
function toWholeCount(value: unknown): number {
  return Math.max(0, Math.trunc(Number(value) || 0))
}

/** Stock per SKU across the given lanes, skipping placeholder SKUs. Unused lanes still count. */
export function countCurrentStockBySku(
  cells: LayoutCell[],
  skuById: Map<string, Sku>
): Map<string, number> {
  const counts = new Map<string, number>()
  for (const cell of cells) {
    for (const skuId of getCellDisplaySkuIds(cell, skuById)) {
      counts.set(skuId, (counts.get(skuId) ?? 0) + 1)
    }
  }

  return counts
}

/** Real drinks in a lane with their restock dates; placeholder SKUs are left out. */
export function getLaneDrinks(
  cell: LayoutCell,
  skuById: Map<string, Sku>
): LaneDrink[] {
  if (!cell.location) {
    return []
  }

  const entries = getStockLocationSkuEntries(cell.location)
  const drinks: LaneDrink[] = []
  for (const [skuIndex, entry] of entries.entries()) {
    const sku = skuById.get(entry.skuId)
    if (isPlaceholderSku(entry.skuId, sku)) {
      continue
    }
    drinks.push({
      addedAt: entry.addedAt ?? null,
      position: drinks.length + 1,
      sku,
      skuId: entry.skuId,
      skuIndex,
    })
  }
  return drinks
}

export function isAgedDrink(
  addedAt: string | null,
  rule: AgedStockRule | undefined,
  now: Date
): boolean {
  if (!rule) {
    return false
  }
  const days = getDaysSince(addedAt, now)
  return days !== null && days >= rule.thresholdDays
}

/** Lanes holding a drink at or past the threshold; unused lanes never count. */
export function findAgedLaneIds(
  board: LayoutCabinet[],
  skuById: Map<string, Sku>,
  rule: AgedStockRule | undefined,
  now: Date
): Set<string> {
  const laneIds = new Set<string>()
  if (!rule) {
    return laneIds
  }
  for (const cell of getBoardCells(board)) {
    if (!cell.location || isLocationUnused(cell.location)) {
      continue
    }
    const hasAgedDrink = getLaneDrinks(cell, skuById).some((drink) =>
      isAgedDrink(drink.addedAt, rule, now)
    )
    if (hasAgedDrink) {
      laneIds.add(cell.location.id)
    }
  }
  return laneIds
}

/** A lane's SKUs without placeholders. */
export function getCellDisplaySkuIds(
  cell: LayoutCell,
  skuById: Map<string, Sku>
): string[] {
  return getCellSkuIds(cell).filter(
    (skuId) => !isPlaceholderSku(skuId, skuById.get(skuId))
  )
}

export function getCellSkuIds(cell: LayoutCell): string[] {
  return cell.location ? getStockLocationSkuIds(cell.location) : []
}

/** Whether the scanned drink may go in this lane; `""` while there is nothing to show. */
export function getRestockingPlacementCellState(
  cell: LayoutCell,
  restockingPlacement?: RestockingPlacementState
): "can-place" | "cannot-place" | "" {
  if (
    !restockingPlacement?.scannedSkuId ||
    !restockingPlacement.compatibilityKnown ||
    !cell.location ||
    isLocationBlocked(cell.location)
  ) {
    return ""
  }

  return restockingPlacement.unstockableLaneIds.has(cell.location.id)
    ? "cannot-place"
    : "can-place"
}
