import type {
  RobotLiveCamera,
  RobotLiveDetection,
  RobotLiveDetector,
  RobotLiveEStop,
  TeleopErrorCodeName,
} from "~/api/opm/schemas"

import { canStoreFixTeleopError, type WorkStatus } from "./robot-status"

/**
 * What store staff should act on, from OPM's `RobotLiveData`
 * (`HumanDetectionResult`, `StopStatus`, `EStopStatus`, the two detection
 * cameras), the robot's work status and teleoperation error, and the app's
 * own failed restart.
 */
export type RobotDetector = RobotLiveDetector

export type RobotEStop = RobotLiveEStop

/**
 * Why the robot waits for store staff. Only states the data identifies with
 * certainty: detection alone (staff restocking inside) is not a cause, nor is
 * a rest position the app did not cause itself.
 */
export type RobotAttentionCause =
  | RobotDetector
  | "eStop"
  /** The app's own restart failed after retries. */
  | "resumeFailed"
  /** Requesting teleoperation for an error staff can fix by hand. */
  | "teleopFixable"

/**
 * `blocking`: the robot stays stopped until staff act, so the panel takes
 * over the action area. `assist`: an operator will handle it, staff fixing
 * it only makes it sooner, so it is offered without hiding anything.
 */
export type RobotAttentionLevel = "blocking" | "assist"

export type RobotAttention = {
  /** `null` until the robot reports detection. */
  detected: Record<RobotDetector, boolean> | null
  /** `null` until the robot reports it. */
  eStop: RobotEStop | null
  cause: RobotAttentionCause | null
  level: RobotAttentionLevel | null
  /**
   * A detector stopped the robot right after the app restarted it (end of a
   * task or walk-in): staff clear it, then restart the robot themselves.
   */
  retryable: boolean
  /** Why the robot asks for an operator, when the cause is `teleopFixable`. */
  teleopError: TeleopErrorCodeName | null
  cameras: RobotLiveCamera[]
}

export const ROBOT_DETECTORS: RobotDetector[] = [
  "human",
  "obstacle",
  "fallenDrink",
]

/** Causes that show the detection camera frames. */
export const CAMERA_CAUSES: ReadonlySet<RobotAttentionCause> = new Set([
  "human",
  "obstacle",
  "fallenDrink",
  "teleopFixable",
])

/**
 * The robot asking an operator for help. The current robot client reports a
 * placement adjustment as RequestingTeleoperation and never sends the two
 * correction statuses; they are treated alike in case it does.
 */
export const TELEOP_REQUEST_STATUSES: ReadonlySet<WorkStatus | undefined> =
  new Set<WorkStatus>([
    "RequestingTeleoperation",
    "RequestingGraspingCorrection",
    "RequestingPlacementCorrection",
  ])

export type RobotWorkState = {
  /** `undefined` while the status is unknown, stale or there is no robot. */
  status: WorkStatus | undefined
  /** Read only while the robot requests teleoperation. */
  teleopError: TeleopErrorCodeName | null
  /** The app's own restart failed after retries. */
  resumeFailed: boolean
  /** The app restarted the robot moments ago. */
  justRestarted: boolean
  /** A detector saw this when staff handed the robot back, so the app held the restart. */
  restartHeldBy: RobotDetector | null
}

/**
 * The single cause to show, most urgent first: nothing moves while an e-stop
 * holds; then what a detector stopped on; then the app's own failed restart;
 * then an operator request staff could fix sooner.
 */
export function toRobotAttention(
  live: RobotLiveDetection | undefined,
  robot: RobotWorkState
): RobotAttention {
  const eStopHolds = live?.eStop === "pressed" || live?.eStop === "needsReset"
  const teleopFixable =
    TELEOP_REQUEST_STATUSES.has(robot.status) &&
    robot.teleopError !== null &&
    canStoreFixTeleopError(robot.teleopError)
  // A dropped drink only staff can pick up, whichever signal arrives first.
  const fallenDrinkAlso = teleopFixable && live?.detected?.fallenDrink
  const cause: RobotAttentionCause | null = eStopHolds
    ? "eStop"
    : (live?.stoppedBy ??
      robot.restartHeldBy ??
      (fallenDrinkAlso
        ? "fallenDrink"
        : robot.resumeFailed && robot.status === "RestPosition"
          ? "resumeFailed"
          : teleopFixable
            ? "teleopFixable"
            : null))
  return {
    detected: live?.detected ?? null,
    eStop: live?.eStop ?? null,
    cause,
    level:
      cause === null ? null : cause === "teleopFixable" ? "assist" : "blocking",
    retryable:
      (robot.justRestarted || robot.restartHeldBy !== null) &&
      (cause === "human" || cause === "obstacle" || cause === "fallenDrink"),
    teleopError: cause === "teleopFixable" ? robot.teleopError : null,
    cameras: live?.cameras ?? [],
  }
}
