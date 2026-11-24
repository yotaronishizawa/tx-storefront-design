import { useMemo, useState } from "react"

import { isRestockStudy } from "~/config/restock-study"
import { useMisplacedStock, useSkuById, useStockBoard } from "~/domains/shelf"
import { useSelectedStore } from "~/domains/store-selection"
import { useCurrentTime } from "~/hooks/use-current-time"
import {
  getBoardCells,
  getLaneDrinks,
  isAgedDrink,
  isLocationUnused,
} from "~/model/shelf"
import { getAgedStockRule } from "~/model/store-display"

/** One drink to take out of the stock shelf, and why. */
export type TakeOutItemView = {
  skuId: string
  count: number
  /** Off the display shelf's layout, or kept past the store's aged-stock days. */
  reason: "offDisplay" | "aged"
}

/**
 * Study (2026-11-02): with restocking and taking out as one task, the
 * restock list gets a second list beside it, of drinks to take out. Built
 * from what the manual screen already marks: drinks the display layout no
 * longer has, then drinks past the aged-stock rule. Undefined outside the study.
 */
export function useTakeOutPlan(): TakeOutItemView[] | undefined {
  const [study] = useState(isRestockStudy)
  const board = useStockBoard()
  const skuById = useSkuById()
  const misplaced = useMisplacedStock()
  const rule = getAgedStockRule(useSelectedStore())
  const now = useCurrentTime()

  return useMemo(() => {
    if (!study) {
      return undefined
    }
    const items = new Map<string, TakeOutItemView>()
    for (const cell of getBoardCells(board)) {
      if (!cell.location || isLocationUnused(cell.location)) {
        continue
      }
      for (const drink of getLaneDrinks(cell, skuById)) {
        const reason = misplaced.skuIds.has(drink.skuId)
          ? "offDisplay"
          : isAgedDrink(drink.addedAt, rule, now)
            ? "aged"
            : null
        if (!reason) {
          continue
        }
        const key = `${reason}:${drink.skuId}`
        const item = items.get(key) ?? { skuId: drink.skuId, count: 0, reason }
        item.count += 1
        items.set(key, item)
      }
    }
    // Off the layout first: those have no place on the display shelf at all.
    return [...items.values()].sort(
      (left, right) =>
        Number(left.reason === "aged") - Number(right.reason === "aged") ||
        right.count - left.count
    )
  }, [board, misplaced, now, rule, skuById, study])
}
