import { getStockShelfLocations, removeSkusFromStock } from "~/api/opm"
import type { StockDrinkRemoval } from "~/api/opm/schemas"
import { createLogger } from "~/config/logger"
import { useRestockRequest, useStoreActionRunner } from "~/domains/operations"
import { useRobotOperationMode, useRobotWorkStatus } from "~/domains/robot"
import { useSession } from "~/domains/session"
import { useSelectedStore } from "~/domains/store-selection"
import { isRequestInProgress } from "~/model/request-state"
import { getStockRemovalBlock } from "~/model/robot-status"
import { planSkuRemoval } from "~/model/shelf"

import { readShelfState } from "../shelf-store"

const logger = createLogger("Stock Drink Removal")

/**
 * Blocked while a restock is in progress or while the robot could be using the
 * lane; OPM checks again on removal. A paused restock does not block, as in
 * OPM's `CheckIfCanRemoveSku`: that is when the operator fixes a red lane.
 */
export function useStockDrinkRemoval() {
  const session = useSession()
  const selectedStore = useSelectedStore()
  const restockRequest = useRestockRequest()
  const workStatus = useRobotWorkStatus()
  const operationMode = useRobotOperationMode()
  const runAction = useStoreActionRunner()

  const storeId = selectedStore?.id ?? ""
  const token = session?.token ?? ""

  const block = getStockRemovalBlock({
    restocking: isRequestInProgress(restockRequest),
    workStatus,
    operationMode,
  })

  /** One call per lane; clearing a lane passes every drink in it. */
  async function removeDrinks(
    locationId: string,
    removals: StockDrinkRemoval[]
  ): Promise<boolean> {
    if (removals.length === 0 || block || !storeId || !token) {
      return false
    }

    const removed = await removeFromLane(locationId, removals)
    await reloadStockLocations()
    return removed
  }

  /**
   * Every drink of one SKU, lane by lane. Stops at the first lane OPM refuses,
   * so the operator sees one popup rather than one per lane.
   */
  async function removeSku(skuId: string): Promise<boolean> {
    const plan = planSkuRemoval(readShelfState().stockLocations, skuId)
    if (plan.length === 0 || block || !storeId || !token) {
      return false
    }

    let removed = true
    for (const { locationId, removals } of plan) {
      removed = await removeFromLane(locationId, removals)
      if (!removed) {
        break
      }
    }
    await reloadStockLocations()
    return removed
  }

  function removeFromLane(locationId: string, removals: StockDrinkRemoval[]) {
    return runAction("remove-drink", () =>
      removeSkusFromStock(storeId, locationId, removals, token)
    )
  }

  // Reload either way: a refusal such as `DifferentSkuId` means our copy of the lane is stale.
  function reloadStockLocations() {
    return getStockShelfLocations(storeId, token)
      .then((locations) => readShelfState().setStockLocations(locations))
      .catch((caught: unknown) => {
        logger.warn("Failed to reload stock shelf after a removal.", caught)
      })
  }

  return { block, removeDrinks, removeSku }
}
