import { getRobotStatus } from "~/api/opm"
import { decodeOpmError } from "~/api/opm/schemas"
import {
  getRobotControls,
  isTeleoperationStatus,
  type RobotRestOutcome,
} from "~/model/robot-status"
import { pollUntil } from "~/utils/poll"
import { asRecord } from "~/utils/record"

import { stopRobotOperationWithFallback } from "./robot-operations"

// About 5 minutes.
const REST_WAIT = { retries: 100, intervalMs: 3000 }

/** OPM rewrites the layout without checking the robot, so it is parked first. */
export async function bringRobotToRest(
  robotId: string,
  token: string
): Promise<RobotRestOutcome> {
  const workStatus = (await getRobotStatus(robotId, token))?.status ?? ""
  if (workStatus === "RestPosition") {
    return "resting"
  }

  const { canStop } = getRobotControls({
    workStatus,
    operationMode: "",
    hasRobot: true,
    isOnline: true,
    statusStale: false,
    robotOperating: false,
    sessionInProgress: false,
  })
  if (!canStop) {
    if (workStatus === "NotStartedYet") {
      return "not-started"
    }
    return isTeleoperationStatus(workStatus)
      ? "waiting-operator"
      : "cannot-stop"
  }

  const result = await stopRobotOperationWithFallback(robotId, token)
  const response = asRecord(result)
  if (typeof response.error !== "number" && typeof response.error !== "string")
    return "cannot-stop"
  const stopError = decodeOpmError(response.error, "StopRobotOperationErrors")
  if (stopError?.name === "TeleoperationInProgress") {
    return "waiting-operator"
  }
  if (result === false || stopError) {
    return "cannot-stop"
  }

  const parked = await pollUntil(
    async () =>
      (await getRobotStatus(robotId, token))?.status === "RestPosition",
    REST_WAIT
  )
  return parked ? "resting" : "cannot-stop"
}
