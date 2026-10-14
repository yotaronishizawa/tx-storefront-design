import type { ParseKeys } from "i18next"

import type { RobotStatusKind } from "~/model/robot-status"

/**
 * The status pill (design "Status Panel", 2026-10-09). Errors staff cannot fix
 * read as "operator handling" rather than naming the fault: naming it only
 * worries staff, and there is nothing for them to do.
 *
 * On purpose there is no "safe to enter / keep out" reading: staff should not
 * have to judge that from the status. To go into the walk-in they always use
 * "Enter the walk-in", which stops the robot first if it is running.
 */
export const ROBOT_STATUS_LABELS: Record<RobotStatusKind, ParseKeys<"app">> = {
  operating: "workflow.home.pill.pnp",
  scanning: "workflow.home.pill.scanning",
  standby: "workflow.home.pill.standby",
  teleoperation: "robotStatusTeleoperationTitle",
  waitingOperator: "robotStatusTeleoperationTitle",
  starting: "robotStatusRobotStartingTitle",
  notStarted: "robotStatusSystemBootWaitingTitle",
  atRest: "robotStatusStoppedTitle",
  movingToRest: "robotStatusMovingToRestTitle",
  startFailed: "robotStatusTeleoperationTitle",
  poweredOff: "robotStatusTeleoperationTitle",
  error: "robotStatusTeleoperationTitle",
  capturing: "workflow.home.pill.capture",
  connectionError: "robotStatusTeleoperationTitle",
  noRobot: "workflow.home.pill.noRobot",
  unknown: "workflow.home.pill.unknown",
}

/** Green while the robot is moving or about to; grey otherwise. */
export const ROBOT_MOVING_KINDS: ReadonlySet<RobotStatusKind> = new Set([
  "operating",
  "scanning",
  "starting",
  "movingToRest",
  "capturing",
])
