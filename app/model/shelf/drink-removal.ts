import type { StockDrinkRemoval } from "~/api/opm/schemas"

import type { LaneDrink } from "./lane-stock"
import type { ShelfLocation } from "./lane-update"
import { getStockLocationSkuIds, isLocationUnused } from "./location"

/** The drinks to take out of one lane, as one `RemoveSkusFromStock` call sends them. */
export type LaneMarks = {
  locationId: string
  removals: StockDrinkRemoval[]
}

/**
 * Every drink of `skuId`, lane by lane. A lane is included whatever its state,
 * so nothing of that SKU is left behind.
 *
 * @example planSkuRemoval([{ id: "l1", skuIds: ["a", "b", "a"] }] as ShelfLocation[], "a") // [{ locationId: "l1", removals: [{ skuId: "a", skuIndex: 0 }, { skuId: "a", skuIndex: 2 }] }]
 */
export function planSkuRemoval(
  locations: ShelfLocation[],
  skuId: string
): LaneMarks[] {
  return locations.flatMap((location) => {
    const removals = getStockLocationSkuIds(location).flatMap((id, skuIndex) =>
      id === skuId ? [{ skuId, skuIndex }] : []
    )
    return removals.length > 0 ? [{ locationId: location.id, removals }] : []
  })
}

/**
 * How many drinks of `skuId` a lane shows as stocked; an unused lane shows none.
 *
 * @example countLaneSku({ id: "l1", skuIds: ["a", "b", "a"] } as ShelfLocation, "a") // 2
 */
export function countLaneSku(location: ShelfLocation, skuId: string): number {
  if (!skuId || isLocationUnused(location)) {
    return 0
  }
  return getStockLocationSkuIds(location).filter((id) => id === skuId).length
}

/**
 * The marked drinks that are still where they were marked. A lane update can
 * move or take one out while the operator is marking; removing by a stale
 * index would take out the wrong drink.
 *
 * @example keepCurrentRemovals([{ skuId: "a", skuIndex: 0 }, { skuId: "b", skuIndex: 1 }], [{ skuId: "a", skuIndex: 0 }] as LaneDrink[]) // [{ skuId: "a", skuIndex: 0 }]
 */
export function keepCurrentRemovals(
  marked: readonly StockDrinkRemoval[],
  drinks: readonly LaneDrink[]
): StockDrinkRemoval[] {
  return marked.filter((mark) =>
    drinks.some(
      (drink) => drink.skuIndex === mark.skuIndex && drink.skuId === mark.skuId
    )
  )
}
