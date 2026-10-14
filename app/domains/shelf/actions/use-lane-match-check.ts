import { forceDiscrepancyResolution } from "~/api/opm"
import type { ForceDiscrepancyResolutionResponse } from "~/api/opm/schemas"
import { readAppShellState } from "~/domains/app-shell"
import { useStoreActionRunner } from "~/domains/operations"
import { useStoreContext } from "~/domains/store-selection"
import { translate } from "~/initializer/i18n"
import { fromOpmLocationError, type ShelfLocation } from "~/model/shelf"

import { readShelfState } from "../shelf-store"

export function useLaneMatchCheck() {
  const context = useStoreContext()
  const runAction = useStoreActionRunner()

  async function checkLaneMatched(locationId: string): Promise<boolean> {
    if (!context || !locationId) {
      return false
    }
    const { session, selectedStore } = context

    const answer: { response?: ForceDiscrepancyResolutionResponse } = {}
    const ok = await runAction("check-lane", async () => {
      answer.response = await forceDiscrepancyResolution(
        selectedStore.id,
        locationId,
        session.token
      )
      return answer.response
    })
    const { response } = answer
    if (!ok || !response) {
      return false
    }

    applyLaneMatchResult(locationId, response)
    if (response.isLaneDisabled) {
      readAppShellState().setNotice(translate("laneCheckDisabledNotice"))
    }
    return true
  }

  return { checkLaneMatched }
}

/**
 * A disabled lane is blacklisted and cleared; otherwise the lane takes the
 * errors OPM says remain, without waiting for the next lane update.
 */
function applyLaneMatchResult(
  locationId: string,
  { isLaneDisabled, laneErrors }: ForceDiscrepancyResolutionResponse
) {
  const remaining = isLaneDisabled ? [] : laneErrors.map(fromOpmLocationError)
  const shelf = readShelfState()
  const nextLocations = shelf.stockLocations.map((location): ShelfLocation => {
    if (location.id !== locationId) {
      return location
    }
    return {
      ...location,
      errors: [],
      isBlackList: location.isBlackList || isLaneDisabled,
      laneErrors: remaining,
      laneEventType: remaining.length > 0 ? "Error" : "SnapShot",
    }
  })
  shelf.setStockLocations(nextLocations)
}
