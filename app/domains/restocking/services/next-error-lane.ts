import {
  readOperationsState,
  selectManualReplenishmentRequest,
  selectRestockRequest,
} from "~/domains/operations"
import { readShelfState, selectErrorLaneIds } from "~/domains/shelf"
import { isActiveRequest, isRequestInProgress } from "~/model/request-state"
import { getLaneErrorPriority } from "~/model/shelf"

import { readRestockingState } from "../restocking-store"

/**
 * Opens the drawer on the most urgent red lane while a restock is open (a lane
 * error pauses it, so not only in progress) or a manual replenishment is in
 * progress. A drawer already on a lane of that urgency stays put, so the
 * operator is not pulled off mid-fix.
 */
export function openNextErrorLane() {
  const operations = readOperationsState()
  if (
    !isActiveRequest(selectRestockRequest(operations)) &&
    !isRequestInProgress(selectManualReplenishmentRequest(operations))
  ) {
    return
  }
  const [nextLaneId] = selectErrorLaneIds(readShelfState())
  const restocking = readRestockingState()
  if (!nextLaneId || isOnMostUrgentLane(restocking.laneDrawerId, nextLaneId)) {
    return
  }
  // Leaving a lane with drinks marked asks Finish or Cancel first.
  restocking.requestLaneSwitch(nextLaneId)
  readShelfState().focusCell({ kind: "stock", id: nextLaneId })
}

function isOnMostUrgentLane(openLaneId: string, mostUrgentLaneId: string) {
  const shelf = readShelfState()
  if (!openLaneId || !selectErrorLaneIds(shelf).includes(openLaneId)) {
    return false
  }
  const rank = (id: string) => {
    const location = shelf.stockLocations.find((item) => item.id === id)
    return location ? getLaneErrorPriority(location) : 0
  }
  return rank(openLaneId) >= rank(mostUrgentLaneId)
}
