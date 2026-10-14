import { readAppShellState } from "~/domains/app-shell"
import {
  askForActionRefusal,
  readOperationsState,
  withSupportCodes,
} from "~/domains/operations"
import {
  readRobotState,
  selectRobotOperationMode,
  selectRobotStatusBeforeDisconnect,
  selectRobotWorkStatus,
} from "~/domains/robot"
import { readShelfState, selectLaneErrorBlock } from "~/domains/shelf"
import {
  readStoreSelectionState,
  selectSelectedStore,
} from "~/domains/store-selection"
import { translate } from "~/initializer/i18n"
import { blocksRestockingStartOrEnd } from "~/model/shelf"
import {
  getManualStartRefusal,
  getRestockingStartRefusal,
} from "~/model/start-refusal"
import { hasShelfClient } from "~/model/store-display"

import { readRestockingState } from "../restocking-store"

/** The support code for a disconnected Pico scanner. */
const PICO_SCANNER_DISCONNECTED_CODE = "S000114"

/**
 * Shows the lane-error notice and answers `true` when lane errors block Start
 * or End. Clearing the dismissed key brings the lane-error popup back after it.
 */
export function refuseForLaneErrors(): boolean {
  if (!blocksRestockingStartOrEnd(selectLaneErrorBlock(readShelfState()))) {
    return false
  }
  readAppShellState().setError(translate("restockingLaneErrorsBlock"))
  readRestockingState().setDismissedLaneErrorKey("")
  return true
}

/** Shows why Start would be refused, before its dialog, and answers `true`; otherwise `false`. */
export function refuseRestockingStart(): boolean {
  if (refuseForLaneErrors()) {
    return true
  }
  // With a shelf client, OPM answers this itself (ShelfClientTimeout, with Retry).
  const store = selectSelectedStore(readStoreSelectionState())
  if (!hasShelfClient(store) && !readShelfState().smartShelfConnected) {
    readAppShellState().setError(translate("restockingShelfCannotConnect"))
    return true
  }
  if (refuseForScannerDisconnected()) {
    return true
  }
  const refusal = getRestockingStartRefusal(readStartContext())
  if (refusal) {
    void askForActionRefusal("start-restocking", refusal)
    return true
  }
  return false
}

/**
 * The same for manual replenishment, which also needs a live, recent shelf
 * client. Retry on the popup calls `retry`.
 */
export function refuseManualStart(retry: () => void): boolean {
  const shelf = readShelfState()
  const refusal = getManualStartRefusal({
    ...readStartContext(),
    hasConstraintLaneError: blocksRestockingStartOrEnd(
      selectLaneErrorBlock(shelf)
    ),
    hasShelfClient: hasShelfClient(
      selectSelectedStore(readStoreSelectionState())
    ),
    now: new Date(),
    shelfClient: shelf.shelfClientReport,
    shelfClientPolled: readRestockingState().smartShelvesStatusKnown,
  })
  if (refusal) {
    void askForActionRefusal("start-manual", refusal).then((retrying) => {
      if (retrying) {
        retry()
      }
    })
    return true
  }
  return false
}

/** The requests and robot as last polled; OPM still refuses whatever changed since. */
function readStartContext() {
  const robotState = readRobotState()
  return {
    requests: readOperationsState().requests,
    robot: robotState.robot
      ? {
          status: selectRobotWorkStatus(robotState),
          opMode: selectRobotOperationMode(robotState),
          statusBeforeDisconnect: selectRobotStatusBeforeDisconnect(robotState),
        }
      : null,
  }
}

function refuseForScannerDisconnected(): boolean {
  if (readRestockingState().scannerConnected) {
    return false
  }
  readAppShellState().setError(
    withSupportCodes(translate("restockingScannerDisconnected"), [
      PICO_SCANNER_DISCONNECTED_CODE,
    ])
  )
  return true
}
