import type {
  RequestContext,
  StartManualReplenishmentErrorsName,
  StartRestockingErrorsName,
  StopRobotOperationErrorsName,
} from "~/api/opm/schemas"

import { isActiveRequest } from "./request-state"
import {
  isTeleoperationStatus,
  type OperationMode,
  type WorkStatus,
} from "./robot-status"
import {
  isShelfClientReportStale,
  isShelfClientVersionAtLeast,
  MANUAL_REPLENISHMENT_MIN_SHELF_CLIENT,
  type ShelfClientReport,
} from "./shelf-client"

/** What OPM would answer to a start, worked out from the requests and robot already held. */
type StartRefusal<E extends string> = {
  error: E
  stopRobotOperationError?: StopRobotOperationErrorsName
}

type StartContext = {
  requests: RequestContext[]
  /** `null` when the store has no robot. */
  robot: {
    status: WorkStatus
    opMode: OperationMode
    /** The status OPM last saw before the robot went offline. */
    statusBeforeDisconnect?: WorkStatus
  } | null
}

/** What only manual replenishment checks: the shelf client it works through. */
type ManualStartContext = StartContext & {
  hasShelfClient: boolean
  /** A lane holds a drink too big for it; OPM ignores every other lane error here. */
  hasConstraintLaneError: boolean
  shelfClient: ShelfClientReport | null
  /** The first smart shelves status has answered for this store. */
  shelfClientPolled: boolean
  now: Date
}

/**
 * OPM's `CanStartRestocking`, minus the checks only OPM can make. OPM reports
 * `RobotCannotBeStopped` as `RobotNotInRestPosition` here.
 */
export function getRestockingStartRefusal({
  requests,
  robot,
}: StartContext): StartRefusal<StartRestockingErrorsName> | null {
  if (hasOpenRequest(requests, "ManualReplenishment")) {
    return { error: "ManualReplenishmentInProgress" }
  }
  if (!robot) {
    return null
  }
  if (isTeleoperationStatus(robot.status)) {
    return { error: "TeleoperationInProgress" }
  }
  if (robot.status === "AutomationCapture3d") {
    return { error: "Capture3dInProgress" }
  }
  if (cannotBeStopped(robot)) {
    return { error: "RobotNotInRestPosition" }
  }
  return null
}

/** OPM's `CanStartManualReplenishment`, in its order, from what the app already holds. */
export function getManualStartRefusal({
  hasConstraintLaneError,
  hasShelfClient,
  now,
  requests,
  robot,
  shelfClient,
  shelfClientPolled,
}: ManualStartContext): StartRefusal<StartManualReplenishmentErrorsName> | null {
  // OPM answers an incompatible store as `ShelvesError`.
  if (!hasShelfClient) {
    return { error: "ShelvesError" }
  }
  if (hasOpenRequest(requests, "Restock")) {
    return { error: "RestockingTaskOpen" }
  }
  if (robot && isTeleoperationStatus(robot.status)) {
    return {
      error: "StopRobotOperationError",
      stopRobotOperationError: "TeleoperationInProgress",
    }
  }
  if (robot && (cannotBeStopped(robot) || wentOfflineAway(robot))) {
    return {
      error: "StopRobotOperationError",
      stopRobotOperationError: "RobotCannotBeStopped",
    }
  }
  if (hasConstraintLaneError) {
    return { error: "StockLayoutHasErrors" }
  }
  // Not polled yet: OPM's own Start still answers ShelfClientTimeout.
  if (!shelfClientPolled) {
    return null
  }
  if (!shelfClient || isShelfClientReportStale(shelfClient, now)) {
    return { error: "ShelfClientTimeout" }
  }
  if (
    !isShelfClientVersionAtLeast(
      shelfClient.version,
      MANUAL_REPLENISHMENT_MIN_SHELF_CLIENT
    )
  ) {
    return { error: "IncompatibleShelfClientVersion" }
  }
  return null
}

function hasOpenRequest(
  requests: RequestContext[],
  type: "ManualReplenishment" | "Restock"
): boolean {
  return requests.some(
    (request) => request.requestType === type && isActiveRequest(request)
  )
}

/** OPM cannot stop a robot that dropped offline anywhere but at rest. */
function wentOfflineAway(robot: NonNullable<StartContext["robot"]>): boolean {
  return (
    robot.status === "Offline" &&
    robot.statusBeforeDisconnect !== "RestPosition"
  )
}

/** OPM refuses a robot that never started, since its stop call cannot answer for one. */
function cannotBeStopped(robot: NonNullable<StartContext["robot"]>): boolean {
  return robot.status === "NotStartedYet" && robot.opMode !== "Maintenance"
}
