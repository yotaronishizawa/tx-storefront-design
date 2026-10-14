import type {
  RobotOperationModeName,
  RobotWorkStatusName,
  TeleopErrorCodeName,
} from "~/api/opm/schemas"

/** The robot's work status by name; `""` when there is no robot or no status yet. */
export type WorkStatus = RobotWorkStatusName | ""

/** The robot's operation mode by name; `""` when there is no robot or no mode yet. */
export type OperationMode = RobotOperationModeName | ""

export type RobotRestOutcome =
  | "resting"
  | "cannot-stop"
  | "not-started"
  | "waiting-operator"

export function isAutoPnpOperating(
  workStatus: WorkStatus,
  operationMode: OperationMode
) {
  return (
    workStatus === "AutomationPnpWorking" ||
    workStatus === "AutomationScanWorking" ||
    operationMode === "ProcessingPnpJob" ||
    operationMode === "ProcessingScanJob"
  )
}

export function isTeleoperationStatus(workStatus: WorkStatus) {
  return (
    workStatus === "Teleoperation" || workStatus === "RequestingTeleoperation"
  )
}

/** What a work status means for the operator. Statuses share a kind only if they share every rule. */
export type RobotStatusKind =
  | "operating"
  | "scanning"
  | "standby"
  | "teleoperation"
  | "waitingOperator"
  | "starting"
  | "notStarted"
  | "atRest"
  | "movingToRest"
  | "startFailed"
  | "poweredOff"
  | "error"
  | "capturing"
  | "connectionError"
  | "noRobot"
  | "unknown"

type StatusRule = {
  kind: RobotStatusKind
  canStart: boolean
  canStop: boolean
  /** Only a parked or powered-down robot; everything else, standby and error included, is unsafe. */
  walkIn: boolean
}

const rule = (
  kind: RobotStatusKind,
  canStart: boolean,
  canStop: boolean,
  walkIn = false
): StatusRule => ({ kind, canStart, canStop, walkIn })

const STATUS_RULES: Partial<Record<WorkStatus, StatusRule>> = {
  AutomationPnpWorking: rule("operating", false, true),
  AutomationScanWorking: rule("scanning", false, true),
  // Moving drinks between stock lanes: working, so staff keep out as for PnP.
  AutomationStockToStockPnpWorking: rule("operating", false, true),
  // Still in automatic mode: the next job can start at any moment.
  Standby: rule("standby", false, true),
  // An operator is driving the robot from elsewhere; the tablet does not interrupt them.
  Teleoperation: rule("teleoperation", false, false),
  RequestingTeleoperation: rule("waitingOperator", false, true),
  RequestingGraspingCorrection: rule("waitingOperator", false, false),
  RequestingPlacementCorrection: rule("waitingOperator", false, false),
  StartingRobotSw: rule("starting", false, false),
  NotStartedYet: rule("notStarted", true, false),
  RestPosition: rule("atRest", true, false, true),
  MovingToRestPosition: rule("movingToRest", false, false),
  FailureToStartRobotSw: rule("startFailed", false, false),
  // "Offline" means powered down, not broken: nothing to command, but safe to enter.
  Offline: rule("poweredOff", false, false, true),
  Error: rule("error", false, false),
  AutomationCapture3d: rule("capturing", false, false),
  InternalConnectionError: rule("connectionError", false, false),
}

type RobotControls = {
  kind: RobotStatusKind
  canStart: boolean
  canStop: boolean
  canMoveRestPosition: boolean
  walkInAccessible: boolean
}

/**
 * Which robot controls the operator may use, and whether it is safe to walk in.
 * An offline tablet or stale status shows the last status but offers no control
 * and never reports walk-in safe, since the robot may have moved. A parked robot
 * not yet stopped by the store can still be stopped, so it stays parked.
 */
export function getRobotControls({
  workStatus,
  operationMode,
  hasRobot,
  isOnline,
  statusStale,
  robotOperating,
  sessionInProgress,
}: {
  workStatus: WorkStatus
  operationMode: OperationMode
  hasRobot: boolean
  isOnline: boolean
  statusStale: boolean
  robotOperating: boolean
  /** A restocking or manual replenishment session is in progress. */
  sessionInProgress: boolean
}): RobotControls {
  const reachable = hasRobot && isOnline && !statusStale
  const status = hasRobot
    ? getStatusRule(workStatus, robotOperating || sessionInProgress)
    : rule("noRobot", false, false)
  const parkedNotStopped =
    workStatus === "RestPosition" &&
    operationMode !== "" &&
    operationMode !== "StoppedByStore"

  return {
    kind: status.kind,
    canStart: reachable && status.canStart && !sessionInProgress,
    canStop: reachable && (status.canStop || parkedNotStopped),
    canMoveRestPosition: reachable && workStatus === "RestPosition",
    walkInAccessible: reachable && status.walkIn,
  }
}

// Running as far as staff can tell: the robot is at work or about to be.
const RUNNING_KINDS: ReadonlySet<RobotStatusKind> = new Set([
  "operating",
  "scanning",
  "standby",
  "teleoperation",
  "waitingOperator",
  "capturing",
  "starting",
])

/**
 * Which one button the header robot popup offers: "stop" while the robot is
 * running, "start" while it is stopped. Whether it can be done is told only
 * once it is pressed.
 *
 * @example getRobotPowerAction("standby") // "stop"
 * @example getRobotPowerAction("notStarted") // "start"
 */
export function getRobotPowerAction(kind: RobotStatusKind): "stop" | "start" {
  return RUNNING_KINDS.has(kind) ? "stop" : "start"
}

/**
 * Why staff cannot get the robot parked to walk in: the connection, an
 * operator handling it, a move it must finish first, or a state only the
 * operations center can clear.
 */
export type WalkInBlock = "connection" | "operator" | "busy" | "fault"

const WALK_IN_BLOCKS: Partial<Record<RobotStatusKind, WalkInBlock>> = {
  teleoperation: "operator",
  waitingOperator: "operator",
  starting: "busy",
  movingToRest: "busy",
  capturing: "busy",
}

/**
 * @example getWalkInBlock("teleoperation", true) // "operator"
 * @example getWalkInBlock("notStarted", true) // "fault"
 * @example getWalkInBlock("standby", false) // "connection"
 */
export function getWalkInBlock(
  kind: RobotStatusKind,
  reachable: boolean
): WalkInBlock {
  if (!reachable || kind === "noRobot") return "connection"
  return WALK_IN_BLOCKS[kind] ?? "fault"
}

// Errors over a drink the staff can put right by hand.
const STORE_FIXABLE_TELEOP_ERRORS: ReadonlySet<string> =
  new Set<TeleopErrorCodeName>([
    "FailedToGraspInMotion",
    "FailedToGraspAtStock",
    "AnomalyDetectedOnDisplay",
    "DetectionFailureOnDisplay",
    "DetectionFailureOnStock",
    "EmptyStock",
    "NearStuckStock",
    "FarStuckStock",
  ])

/**
 * Whether staff may clear a teleoperation request themselves and stop the
 * robot, rather than wait for the operator to park it.
 *
 * @example canStoreFixTeleopError("FailedToGraspAtStock") // true
 * @example canStoreFixTeleopError("ServerCrashed") // false
 */
export function canStoreFixTeleopError(code: TeleopErrorCodeName): boolean {
  return STORE_FIXABLE_TELEOP_ERRORS.has(code)
}

/** Why the app is locked: OPM has the robot in maintenance or repair; `""` when it is not. */
export type RobotLock = "" | "maintenance" | "repair" | "teleoperation"

/**
 * As the store app: the mode decides whether to lock, and an operator driving
 * the robot outranks the mode in the message.
 *
 * @example getRobotLock("Repair", "Teleoperation") // "teleoperation"
 * @example getRobotLock("Repair", "Standby") // "repair"
 */
export function getRobotLock(
  operationMode: OperationMode,
  workStatus: WorkStatus
): RobotLock {
  if (operationMode !== "Maintenance" && operationMode !== "Repair") {
    return ""
  }
  if (workStatus === "Teleoperation") {
    return "teleoperation"
  }
  if (operationMode === "Maintenance") {
    return "maintenance"
  }
  return "repair"
}

/** An unlisted status reads as operating while something is known to be running. */
function getStatusRule(workStatus: WorkStatus, busy: boolean): StatusRule {
  const known = STATUS_RULES[workStatus]
  if (known) {
    return known
  }
  return busy ? rule("operating", false, true) : rule("unknown", false, false)
}

/** Why the stock-drink remove buttons are off. `""` means they are on. */
export type StockRemovalBlock =
  | ""
  | "RestockingInProgress"
  | "PnpInProgress"
  | "RobotNotAtRest"

// OPM's own lists, which it checks again on `RemoveSkusFromStock`.
const REMOVE_DRINK_OPERATION_MODES = new Set<OperationMode>([
  "StoppedByStore",
  "Restocking",
  "Maintenance",
  "StoreDayOff",
])
const REMOVE_DRINK_WORK_STATUSES = new Set<WorkStatus>([
  "RestPosition",
  "NotStartedYet",
  "FailureToStartRobotSw",
])

/**
 * Why drinks may not be removed from a stock lane, in OPM's order. An unknown
 * robot does not block, as OPM allows a store with no robot; OPM's queued-jobs
 * check has no local equivalent.
 */
export function getStockRemovalBlock({
  restocking,
  workStatus,
  operationMode,
}: {
  restocking: boolean
  workStatus: WorkStatus
  operationMode: OperationMode
}): StockRemovalBlock {
  if (restocking) {
    return "RestockingInProgress"
  }
  if (operationMode && !REMOVE_DRINK_OPERATION_MODES.has(operationMode)) {
    return "PnpInProgress"
  }
  if (workStatus && !REMOVE_DRINK_WORK_STATUSES.has(workStatus)) {
    return "RobotNotAtRest"
  }
  return ""
}
