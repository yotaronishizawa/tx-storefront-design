import {
  getRobotStatus,
  startRobotOperation,
  stopRobotOperation,
} from "~/api/opm"
import { readSessionState } from "~/domains/session"
import {
  readStoreSelectionState,
  selectSelectedStore,
} from "~/domains/store-selection"

import { readRobotState } from "../robot-store"

// No mode-write fallback: it bypasses OPM's current workflow/capture guards.
export const startRobotOperationWithFallback = startRobotOperation
export const stopRobotOperationWithFallback = stopRobotOperation

/** A late robot read must not replace the robot of a different store/session. */
export async function refreshRobotState(
  robotId: string,
  token: string
): Promise<void> {
  try {
    const robot = await getRobotStatus(robotId, token)
    if (
      robot &&
      selectSelectedStore(readStoreSelectionState())?.robotId === robotId &&
      readSessionState().session?.token === token
    ) {
      readRobotState().setRobot(robot)
    }
  } catch {
    // The poll catches up; a failed read does not invalidate the landed command.
  }
}
