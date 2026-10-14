import type { Sku } from "~/api/opm/schemas"
import { isPlaceholderSku } from "~/model/sku"

import type { LayoutCabinet } from "./board"
import { getBoardCells } from "./cells"
import { getCellDisplaySkuIds } from "./lane-stock"
import type { ShelfLocation } from "./lane-update"
import { getStockLocationSkuIds, isLocationUnused } from "./location"

/** Whether a SKU sitting in the stock shelf has no display-shelf lane to go to. */
export type MisplacementCheck = (skuId: string) => boolean

export type MisplacedStock = {
  laneIds: ReadonlySet<string>
  skuIds: ReadonlySet<string>
}

const NO_MISPLACED_STOCK: MisplacedStock = {
  laneIds: new Set(),
  skuIds: new Set(),
}

/**
 * Before the display layout loads, nothing is misplaced.
 *
 * @example createMisplacementCheck([{ id: "d1", skuId: "a" }], new Map())("b") // true
 */
export function createMisplacementCheck(
  displayLocations: ShelfLocation[],
  skuById: Map<string, Sku>
): MisplacementCheck {
  if (displayLocations.length === 0) {
    return () => false
  }

  const displaySkuIds = new Set<string>()
  for (const location of displayLocations) {
    for (const skuId of getStockLocationSkuIds(location)) {
      displaySkuIds.add(skuId)
    }
  }

  return (skuId) =>
    Boolean(skuId) &&
    !displaySkuIds.has(skuId) &&
    !isPlaceholderSku(skuId, skuById.get(skuId))
}

/**
 * Lanes holding a misplaced drink, and those SKUs; unused lanes are skipped.
 *
 * @example findMisplacedStock([{ id: "s1", skuIds: ["b"] }], (id) => id === "b").laneIds // Set { "s1" }
 */
export function findMisplacedStock(
  stockLocations: ShelfLocation[],
  isMisplaced: MisplacementCheck
): MisplacedStock {
  const laneIds = new Set<string>()
  const skuIds = new Set<string>()

  for (const location of stockLocations) {
    if (isLocationUnused(location)) {
      continue
    }
    for (const skuId of getStockLocationSkuIds(location)) {
      if (isMisplaced(skuId)) {
        laneIds.add(location.id)
        skuIds.add(skuId)
      }
    }
  }

  return laneIds.size > 0 ? { laneIds, skuIds } : NO_MISPLACED_STOCK
}

/**
 * Drinks in the given lanes that are not on the display shelf, over every cabinet.
 *
 * @example countMisplacedDrinks(board, skuById, new Set(["s1"]), (id) => id === "b") // 2, with s1 holding ["b", "b"]
 */
export function countMisplacedDrinks(
  board: LayoutCabinet[],
  skuById: Map<string, Sku>,
  misplacedLaneIds: ReadonlySet<string>,
  isMisplaced: MisplacementCheck
): number {
  return getBoardCells(board)
    .filter((cell) => misplacedLaneIds.has(cell.id))
    .flatMap((cell) => getCellDisplaySkuIds(cell, skuById))
    .filter(isMisplaced).length
}
