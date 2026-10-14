import type { ParseKeys } from "i18next"

import {
  enumSupportCode,
  type InvalidPnpJobContextReasonName,
  type PnpJobContextWarningName,
  type PnpJobValidation,
  type PrepareManualPnpJobErrorCodeName,
  type SmartShelfModesName,
  type SmartShelvesStatus,
} from "~/api/opm/schemas"

import type { OperationMode, WorkStatus } from "./robot-status"

type AppKey = ParseKeys<"app">

/** Why a display reservation stops: `message`, the call-centre line when `callCenter`, then the support codes. */
export type ReservationRefusal = {
  message: AppKey
  callCenter: boolean
  codes: string[]
  /** The tablet's layout is out of date: drop the selection and reload it. */
  reloadLayout: boolean
  /** Shown as a picture of the stock shelf instead of the message. */
  illustrated: IllustratedRefusal | null
}

/** The two illustrated refusals, for when no stock lane can give up the drink. */
export type IllustratedRefusal = "source-blocked" | "source-not-enough"

/** What to do with a job OPM validated. */
type ReservationVerdict =
  | { kind: "send" }
  | { kind: "confirm" }
  | { kind: "refuse"; refusal: ReservationRefusal }

/** Whether a V2 store's shelves are tilted for the robot. */
export type ShelfReadiness = "ready" | ShelfNotReady

type ShelfNotReady =
  | "unknown"
  | "disconnected"
  | "moving"
  | "restocking"
  | "disabled"

const refuse = (
  message: AppKey,
  callCenter: boolean,
  codes: string[] = [],
  reloadLayout = false
): ReservationRefusal => ({
  message,
  callCenter,
  codes,
  reloadLayout,
  illustrated: null,
})

// For a prepare error or validation reason not listed below.
const UNLISTED_MESSAGE: [AppKey, boolean] = [
  "displayReservationCallCenter",
  false,
]

// `[message, callCenter]` per prepare error.
const PREPARE_ERROR_MESSAGES: Partial<
  Record<PrepareManualPnpJobErrorCodeName, [AppKey, boolean]>
> = {
  StoreNotFound: ["displayReservationStoreNotFound", false],
  DestinationNotFound: ["displayReservationPlanogramChanged", true],
  SkuNotFound: ["displayReservationDrinkChanged", true],
  SkuIsIgnored: ["displayReservationSkuIgnored", true],
  NoValidSourceFound: ["displayReservationNoStock", false],
  AllSourceWithSkuBlacklisted: ["displayReservationNoStock", false],
  NoSourceWithSkuFound: ["displayReservationNoStock", false],
  AllSourceWithSkuNotAvailable: ["displayReservationNoStock", false],
  AllSourceWithSkuEmptySkuIdArray: ["displayReservationNoStock", false],
  ManualPnpJobSituationNull: ["displayReservationRetry", true],
  ManualPnpJobSituationNotAvailableToNewManualJob: [
    "displayReservationAlreadyScheduled",
    false,
  ],
  AllSourceWithSkuPendingPnp: ["displayReservationAlreadyScheduled", false],
  AllSourceWithSkuEmpty: ["displayReservationCheckSource", false],
  AllSourceWithSkuBlocked: ["displayReservationBlockedByOther", false],
  AllSourceWithSkuWillHaveNotEnoughSku: [
    "displayReservationBlockedByOther",
    false,
  ],
}

const ILLUSTRATED_PREPARE_ERRORS: Partial<
  Record<PrepareManualPnpJobErrorCodeName, IllustratedRefusal>
> = {
  AllSourceWithSkuBlocked: "source-blocked",
  AllSourceWithSkuWillHaveNotEnoughSku: "source-not-enough",
}

// `[message, callCenter]` per validation reason. The two X-range reasons are
// left out on purpose.
const VALIDATION_ERROR_MESSAGES: Partial<
  Record<InvalidPnpJobContextReasonName, [AppKey, boolean]>
> = {
  StoreNotFound: ["displayReservationRetry", true],
  PnpJobResultNotFound: ["displayReservationRetry", true],
  MaxIterationExceedsSmartShelfAllowedMaxIteration: [
    "displayReservationRetry",
    true,
  ],
  SmartShelfSkuIdArrayUnset: ["displayReservationRetry", true],
  DestinationSkuIdChanged: ["displayReservationPlanogramChanged", true],
  SourceSkuIdChanged: ["displayReservationPlanogramChanged", true],
  DestinationBlacklisted: ["displayReservationCannotShelve", true],
  DestinationBlacklistedDueToOverstock: [
    "displayReservationCannotShelve",
    true,
  ],
  SourceNotAvailable: ["displayReservationNoStockRestock", false],
  SourceBlacklisted: ["displayReservationNoStockRestock", false],
  JobContextNotFound: ["displayReservationRetry", true],
  JobContextNull: ["displayReservationRetry", true],
  DestinationsUnset: ["displayReservationRetry", true],
  SourcesUnset: ["displayReservationRetry", true],
  InvalidMaxIteration: ["displayReservationRetry", true],
  SkuNull: ["displayReservationDrinkChanged", true],
  SkuNotFound: ["displayReservationDrinkChanged", true],
  DestinationCannotFitEntireDrink: ["displayReservationOverstocked", false],
  SkuIgnored: ["displayReservationSkuIgnored", true],
}

// The layout changed under the tablet.
const RELOAD_PREPARE_ERRORS: ReadonlySet<string> =
  new Set<PrepareManualPnpJobErrorCodeName>([
    "DestinationNotFound",
    "SkuNotFound",
    "SkuIsIgnored",
  ])

const RELOAD_VALIDATION_REASONS: ReadonlySet<string> =
  new Set<InvalidPnpJobContextReasonName>([
    "DestinationSkuIdChanged",
    "SourceSkuIdChanged",
    "DestinationBlacklisted",
    "DestinationBlacklistedDueToOverstock",
    "JobContextNotFound",
    "JobContextNull",
    "DestinationsUnset",
    "SourcesUnset",
    "InvalidMaxIteration",
    "SkuNull",
    "SkuIgnored",
  ])

// The reasons a job still goes out on.
const SENDABLE_REASONS: ReadonlySet<string> =
  new Set<InvalidPnpJobContextReasonName>([
    "None",
    "DestinationFull",
    "DestinationNotAvailable",
    "DestinationNeedsScan_NeverScanned",
    "DestinationNeedsScan_LastScannedBeforeRestock",
  ])

// Any warning not listed blocks the job.
const KNOWN_WARNINGS: ReadonlySet<string> = new Set<PnpJobContextWarningName>([
  "DestinationFull",
  "DestinationNotAvailable",
  "DestinationNeedsScan_ScanResultStale",
  "DestinationCannotFitEntireDrink",
  "DestinationNeedsScan_NeverScanned",
  "DestinationNeedsScan_LastScannedBeforeRestock",
  "SmartShelvesStatusNotFound",
  "SmartShelvesStatusStale",
  "SmartShelvesNotReady",
  "SmartShelfClientNotEnabled",
])

const SMART_SHELF_STATUS_WARNINGS: ReadonlySet<string> =
  new Set<PnpJobContextWarningName>([
    "SmartShelvesStatusNotFound",
    "SmartShelvesStatusStale",
    "SmartShelvesNotReady",
  ])

// Overfill and needs-scan: the only warnings an operator may confirm past.
const CONFIRMABLE_WARNINGS: ReadonlySet<string> =
  new Set<PnpJobContextWarningName>([
    "DestinationFull",
    "DestinationNotAvailable",
    "DestinationCannotFitEntireDrink",
    "DestinationNeedsScan_ScanResultStale",
    "DestinationNeedsScan_NeverScanned",
    "DestinationNeedsScan_LastScannedBeforeRestock",
  ])

const NEEDS_SCAN_REASONS: ReadonlySet<string> =
  new Set<InvalidPnpJobContextReasonName>([
    "DestinationNeedsScan_NeverScanned",
    "DestinationNeedsScan_LastScannedBeforeRestock",
  ])

// The codes are the app's own, not OPM's.
const SHELF_NOT_READY: Record<ShelfNotReady, [AppKey, string]> = {
  unknown: ["displayReservationShelfChanging", "S10001"],
  disconnected: ["displayReservationSystemError", "S10002"],
  moving: ["displayReservationShelfChanging", "S10003"],
  restocking: ["displayReservationShelfRestocking", "S10004"],
  disabled: ["displayReservationSystemError", "S10005"],
}

// tx-stock-shelf reports several times a second; OPM itself trusts a report for 3 s.
const SHELF_STATUS_MAX_AGE_MS = 10_000

const SHELF_MODE_READINESS: Record<SmartShelfModesName, ShelfReadiness> = {
  RobotOperation: "ready",
  Unknown: "unknown",
  Initializing: "unknown",
  Calibrating: "unknown",
  Moving: "moving",
  Restocking: "restocking",
  Disconnected: "disconnected",
  Failure: "disconnected",
}

const ROBOT_ACCEPTS_RESERVATION: ReadonlySet<WorkStatus> = new Set([
  "Standby",
  "AutomationPnpWorking",
  "AutomationScanWorking",
])

// Offline counts as under operator control.
const ROBOT_UNDER_OPERATOR: ReadonlySet<WorkStatus> = new Set([
  "RequestingGraspingCorrection",
  "RequestingPlacementCorrection",
  "RequestingTeleoperation",
  "AutomationCapture3d",
  "Teleoperation",
  "Offline",
  "StartingRobotSw",
])

const ROBOT_AT_REST: ReadonlySet<WorkStatus> = new Set([
  "RestPosition",
  "MovingToRestPosition",
  "NotStartedYet",
])

/**
 * Why the robot cannot take a display reservation now, or `null` when it can.
 *
 * @example getRobotReservationBlock("Standby", "Maintenance") // "displayReservationMaintenance"
 * @example getRobotReservationBlock("RestPosition", "StoppedByStore") // "displayReservationStartRobot"
 * @example getRobotReservationBlock("Standby", "ProcessingPnpJob") // null
 */
export function getRobotReservationBlock(
  workStatus: WorkStatus,
  operationMode: OperationMode
): AppKey | null {
  if (operationMode === "Maintenance") {
    return "displayReservationMaintenance"
  }
  if (ROBOT_ACCEPTS_RESERVATION.has(workStatus)) {
    return null
  }
  if (ROBOT_UNDER_OPERATOR.has(workStatus)) {
    return "displayReservationOperatorBusy"
  }
  if (ROBOT_AT_REST.has(workStatus)) {
    return "displayReservationStartRobot"
  }
  return "displayReservationRobotUnknown"
}

/** How to tell the operator about a prepare error. */
export function getPrepareRefusal(
  errorCode: PrepareManualPnpJobErrorCodeName
): ReservationRefusal {
  const [message, callCenter] =
    PREPARE_ERROR_MESSAGES[errorCode] ?? UNLISTED_MESSAGE
  return {
    ...refuse(
      message,
      callCenter,
      codesOf([errorCode], "PrepareManualPnpJobErrorCode"),
      RELOAD_PREPARE_ERRORS.has(errorCode)
    ),
    illustrated: ILLUSTRATED_PREPARE_ERRORS[errorCode] ?? null,
  }
}

/**
 * What to do with a validated job, checked in order: a refused reason, an
 * unknown warning, the smart-shelf checks, then overfill or needs-scan, which
 * the operator confirms. `shelf` is the V2 shelf check, `null` on any other store.
 *
 * @example getReservationVerdict({ reason: "None", warnings: ["DestinationFull"] }, null) // { kind: "confirm" }
 * @example getReservationVerdict({ reason: "None", warnings: ["SmartShelvesNotReady"] }, null).kind // "refuse"
 * @example getReservationVerdict({ reason: "DestinationFull", warnings: [] }, null) // { kind: "send" }
 */
export function getReservationVerdict(
  { reason, warnings }: PnpJobValidation,
  shelf: ShelfReadiness | null
): ReservationVerdict {
  if (!SENDABLE_REASONS.has(reason)) {
    const [message, callCenter] =
      VALIDATION_ERROR_MESSAGES[reason] ?? UNLISTED_MESSAGE
    return {
      kind: "refuse",
      refusal: refuse(
        message,
        callCenter,
        codesOf([reason], "InvalidPnpJobContextReason"),
        RELOAD_VALIDATION_REASONS.has(reason)
      ),
    }
  }

  const warningCodes = codesOf(warnings, "PnpJobContextWarning")
  if (warnings.some((warning) => !KNOWN_WARNINGS.has(warning))) {
    return {
      kind: "refuse",
      refusal: refuse("displayReservationCallCenter", false, warningCodes),
    }
  }

  if (warnings.includes("SmartShelfClientNotEnabled")) {
    if (!shelf) {
      return {
        kind: "refuse",
        refusal: refuse("displayReservationSystemError", true, warningCodes),
      }
    }
    if (shelf !== "ready") {
      const [message, code] = SHELF_NOT_READY[shelf]
      return { kind: "refuse", refusal: refuse(message, true, [code]) }
    }
  }

  if (warnings.some((warning) => SMART_SHELF_STATUS_WARNINGS.has(warning))) {
    return {
      kind: "refuse",
      refusal: refuse("displayReservationSystemError", true, warningCodes),
    }
  }

  const needsConfirmation =
    NEEDS_SCAN_REASONS.has(reason) ||
    warnings.some((warning) => CONFIRMABLE_WARNINGS.has(warning))
  return { kind: needsConfirmation ? "confirm" : "send" }
}

/**
 * Whether a V2 store's shelves are tilted for the robot, from OPM's copy of the
 * shelf's last report. No report reads as a disabled shelf client, an old one
 * as disconnected.
 */
export function getShelfReadiness(
  status: SmartShelvesStatus | null,
  now: number
): ShelfReadiness {
  if (!status?.mode) {
    return "disabled"
  }
  const reportedAt = Date.parse(status.reportedAt)
  if (
    !Number.isFinite(reportedAt) ||
    now - reportedAt > SHELF_STATUS_MAX_AGE_MS
  ) {
    return "disconnected"
  }
  return SHELF_MODE_READINESS[status.mode] ?? "unknown"
}

function codesOf(
  names: string[],
  enumName:
    | "InvalidPnpJobContextReason"
    | "PnpJobContextWarning"
    | "PrepareManualPnpJobErrorCode"
): string[] {
  return names
    .map((name) => enumSupportCode(name, enumName) ?? name)
    .filter(Boolean)
}
