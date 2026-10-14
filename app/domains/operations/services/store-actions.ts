import type { ParseKeys } from "i18next"

import type {
  OpmErrorEnum,
  OpmErrorName,
  StartRobotOperationErrorsName,
  StopRobotOperationErrorsName,
} from "~/api/opm/schemas"
import type { PromptButtons } from "~/domains/app-shell"
import type { StoreAction } from "~/types/busy-action"

type AppKey = ParseKeys<"app">

/** What the operator sees for one failure. */
export type ErrorPopup = {
  buttons: PromptButtons
  /** Dismissing returns to home. */
  home?: boolean
  message: AppKey
  /** Shown without its support code. */
  noCode?: boolean
  /** A `retry` popup gains Cancel after this many failures. */
  cancelAfter?: number
}

/** An OPM answer that refused the command. */
export type ResponseFailure = {
  kind: "failed"
  codes: string[]
  error: OpmErrorName | "UnrecognizedResponse"
  /** Set only when `error` is `StopRobotOperationError`. */
  stopRobotError: StopRobotOperationErrorsName | ""
}

type RetryPolicy = {
  /** Retry a throw up to 3 times at ~1s, 2s, 4s. */
  transport?: boolean
  /** Retry an OPM refusal up to 3 times at ~3s, 6s, 8s while this holds. */
  server?: (failure: ResponseFailure) => boolean
  /** After a server error, wait up to 20s for a reconnect and try again, 5 times in all. */
  reconnect?: boolean
}

export type StoreActionSpec = {
  label: AppKey
  /** OPM's result enum for this command, which also gives its support codes. */
  errors?: OpmErrorEnum
  /** A dedicated popup per OPM error name. */
  popups?: Partial<Record<string, ErrorPopup>>
  /** Used instead of `popups` when `error` is `StopRobotOperationError`. */
  stopRobotPopups?: Partial<Record<string, ErrorPopup>>
  fallback?: ErrorPopup
  /** The call threw. */
  transport?: ErrorPopup
  /** The command landed but the robot did not restart, by `startRobotOperationError`. */
  robotRestartPopups?: Partial<Record<string, ErrorPopup>> & {
    default: ErrorPopup
  }
  retry?: RetryPolicy
  /** Shown once the command lands, instead of the "sent" banner. */
  successPopup?: ErrorPopup
  /** Errors meaning the command already happened, treated as success. */
  alreadyDone?: readonly string[]
}

const ok = (message: AppKey): ErrorPopup => ({ buttons: "ok", message })
const close = (message: AppKey): ErrorPopup => ({ buttons: "close", message })
const retry = (message: AppKey): ErrorPopup => ({
  buttons: "retry-cancel",
  message,
})

const RETRYABLE_STOP_ROBOT_ERRORS = new Set<StopRobotOperationErrorsName | "">([
  "ServerError",
  "RateLimited",
  "WaitForRestPositionTimeout",
])

function isRetryableStartError({ error, stopRobotError }: ResponseFailure) {
  return (
    error === "ServerError" || RETRYABLE_STOP_ROBOT_ERRORS.has(stopRobotError)
  )
}

function same<const Code extends string>(
  codes: readonly Code[],
  popup: ErrorPopup
): Record<Code, ErrorPopup> {
  return Object.fromEntries(codes.map((code) => [code, popup])) as Record<
    Code,
    ErrorPopup
  >
}

function home<const Popups extends Record<string, ErrorPopup>>(
  popups: Popups
): Record<keyof Popups, ErrorPopup> {
  return Object.fromEntries(
    Object.entries(popups).map(([code, popup]) => [
      code,
      { ...popup, home: true },
    ])
  ) as Record<keyof Popups, ErrorPopup>
}

/** `T` with every key outside `Name` typed `never`, so a name the enum lacks fails to compile. */
type OnlyKeys<T, Name extends string> = T &
  Record<Exclude<keyof T, Name>, never>

/** One `STORE_ACTIONS` entry, its popup keys type-checked against the generated OPM enums. */
function action<
  const Enum extends OpmErrorEnum,
  const Popups extends Partial<Record<OpmErrorName<Enum>, ErrorPopup>>,
  const StopPopups extends Partial<
    Record<StopRobotOperationErrorsName, ErrorPopup>
  >,
  const RestartPopups extends Partial<
    Record<StartRobotOperationErrorsName | "default", ErrorPopup>
  >,
>(
  spec: Omit<
    StoreActionSpec,
    | "errors"
    | "popups"
    | "stopRobotPopups"
    | "robotRestartPopups"
    | "alreadyDone"
  > & {
    errors?: Enum
    popups?: OnlyKeys<Popups, OpmErrorName<NoInfer<Enum>>>
    stopRobotPopups?: OnlyKeys<StopPopups, StopRobotOperationErrorsName>
    robotRestartPopups?: OnlyKeys<
      RestartPopups,
      StartRobotOperationErrorsName | "default"
    > & { default: ErrorPopup }
    alreadyDone?: readonly OpmErrorName<NoInfer<Enum>>[]
  }
): StoreActionSpec {
  return spec
}

// Shared by StartRestocking2's own error and its stop-robot error.
const CANNOT_STOP_ROBOT = ok("robotCannotStopNotice")
const TELEOPERATION = ok("teleoperationInProgressNotice")
const SHELF_ERROR = retry("shelfErrorNotice")

// Likewise for StartManualReplenishment.
const MANUAL_START_SERVER_ERROR = retry("manualStartServerErrorNotice")
const MANUAL_SHELF_CODES = [
  "ServerError",
  "ShelvesError",
  "ShelvesAngleCalibrationError",
  "ShelvesInclinationInProgress",
] as const
const MANUAL_START_SHELF_ERRORS = same(
  [...MANUAL_SHELF_CODES, "ShelvesInclinationFailure", "ShelfClientTimeout"],
  MANUAL_START_SERVER_ERROR
)
// `StopRobotOperationErrors` has no inclination failure or client timeout.
const MANUAL_STOP_ROBOT_SHELF_ERRORS = same(
  MANUAL_SHELF_CODES,
  MANUAL_START_SERVER_ERROR
)

const END_RESTOCKING = {
  label: "actionNameEndRestocking",
  errors: "EndRestockingErrors",
  popups: {
    ShelvesError: SHELF_ERROR,
    ShelfClientTimeout: retry("shelfClientTimeoutNotice"),
    ShelvesInclinationFailure: retry("shelfInclineFailedNotice"),
    StockLayoutHasErrors: ok("restockingEndLaneErrors"),
  },
  fallback: ok("serverErrorNotice"),
  transport: ok("connectionLostNotice"),
  alreadyDone: ["RestockingTaskNotFound", "RestockingTaskNotInProgress"],
  retry: { transport: true, reconnect: true },
} as const

// Popups and retries match the Unity store app, so operators get the same answers.
export const STORE_ACTIONS: Record<StoreAction, StoreActionSpec> = {
  "start-auto-pnp": action({
    label: "actionNameStartAutoPnp",
    errors: "StartRobotOperationErrors",
    popups: {
      ShelvesInclinationInProgress: ok("smartShelfAngleChanging"),
      RestockingInProgress: {
        buttons: "to-restocking-or-close",
        message: "robotStartRestockingOpenNotice",
      },
      AnnotationTaskInProgress: close("robotStartAnnotationTaskNotice"),
      ManualReplenishmentInProgress: {
        buttons: "return-to-manual",
        message: "restockingStartManualOpenNotice",
      },
      TeleoperationInProgress: close("teleoperationInProgressNotice"),
      ServerError: retry("retryThenCallCenterNotice"),
    },
    // RobotError, the shelf errors, and anything newer.
    fallback: retry("networkErrorNotice"),
    transport: retry("networkErrorNotice"),
  }),
  "stop-auto-pnp": action({
    label: "actionNameStopAutoPnp",
    errors: "StopRobotOperationErrors",
    popups: {
      ...same(["AlreadyStopping", "RateLimited"], {
        ...close("robotStopAlreadyRequestedNotice"),
        noCode: true,
      }),
      ShelvesInclinationInProgress: ok("smartShelfAngleChanging"),
      ...same(["TeleoperationInProgress", "Capture3dInProgress"], {
        ...close("teleoperationInProgressNotice"),
        noCode: true,
      }),
      ...same(
        ["WaitForRestPositionTimeout", "RobotCannotBeStopped"],
        retry("retryThenCallCenterNotice")
      ),
      ServerError: retry("serverErrorNotice"),
    },
    // RobotNotLinkedToStore, the shelf errors, and anything newer.
    fallback: retry("restartThenCallCenterNotice"),
    transport: retry("networkErrorNotice"),
    successPopup: {
      buttons: "stop-confirmed",
      message: "robotStopCheckNotice",
      noCode: true,
    },
  }),
  "start-robot-software": action({
    label: "actionNameStartRobotSoftware",
    transport: retry("networkErrorNotice"),
  }),
  "start-restocking": action({
    label: "actionNameStartRestocking",
    errors: "StartRestockingErrors",
    popups: {
      ...same(
        ["RobotNotInRestPosition", "Capture3dInProgress"],
        CANNOT_STOP_ROBOT
      ),
      TeleoperationInProgress: TELEOPERATION,
      ShelfClientTimeout: retry("shelfClientTimeoutNotice"),
      ShelvesInclinationFailure: retry("shelfInclineFailedNotice"),
      ...same(
        [
          "ShelvesError",
          "ShelvesAngleCalibrationError",
          "ShelvesInclinationInProgress",
        ],
        SHELF_ERROR
      ),
      WeightStabilizationTimeout: retry("shelfWeightUnstableNotice"),
      ManualReplenishmentInProgress: {
        buttons: "return-to-manual",
        message: "restockingStartManualOpenNotice",
      },
      StockLayoutHasErrors: ok("restockingLaneErrorsBlock"),
    },
    stopRobotPopups: {
      ...same(
        [
          "RobotCannotBeStopped",
          "WaitForRestPositionTimeout",
          "RobotNotLinkedToStore",
          "AlreadyStopping",
          "RateLimited",
          "Capture3dInProgress",
        ],
        CANNOT_STOP_ROBOT
      ),
      TeleoperationInProgress: TELEOPERATION,
      ...same(
        [
          "ShelvesError",
          "ShelvesAngleCalibrationError",
          "ShelvesInclinationInProgress",
        ],
        SHELF_ERROR
      ),
    },
    fallback: ok("restockingStartFailedNotice"),
    transport: retry("connectionLostNotice"),
    retry: { transport: true, server: isRetryableStartError },
  }),
  "end-restocking": action({
    ...END_RESTOCKING,
    robotRestartPopups: {
      default: { ...ok("restockingEndRobotStartFailedNotice"), noCode: true },
    },
  }),
  // `EndRestocking2`: the same answers, but the robot is left stopped.
  "end-restocking-to-manual": action(END_RESTOCKING),
  "start-manual": action({
    label: "actionNameStartManual",
    errors: "StartManualReplenishmentErrors",
    popups: home({
      ...MANUAL_START_SHELF_ERRORS,
      IncompatibleShelfClientVersion: MANUAL_START_SERVER_ERROR,
      PreconditionsUnsatisfied: MANUAL_START_SERVER_ERROR,
      WaitingForRestPositionTimeout: retry("manualStartRobotTimeoutNotice"),
      FailedToOpenCurtains: {
        buttons: "close",
        message: "manualStartCurtainOpenFailedNotice",
      },
      ...same(["StockLayoutHasErrors", "RestockingTaskOpen"], {
        buttons: "to-restocking",
        message: "manualStartRestockingOpenNotice",
      }),
    }),
    stopRobotPopups: home({
      ...MANUAL_STOP_ROBOT_SHELF_ERRORS,
      ServerError: retry("manualStartRobotServerErrorNotice"),
      RateLimited: retry("manualStartRateLimitedNotice"),
      WaitForRestPositionTimeout: retry("manualStartRobotTimeoutNotice"),
      RobotCannotBeStopped: ok("manualStartRobotCannotStopNotice"),
      RobotNotLinkedToStore: ok("manualStartRobotNotLinkedNotice"),
      TeleoperationInProgress: ok("manualStartTeleoperationNotice"),
      Capture3dInProgress: ok("manualStartRobotCapturingNotice"),
    }),
    fallback: { ...retry("manualStartFailedNotice"), home: true },
    transport: {
      buttons: "retry",
      cancelAfter: 3,
      home: true,
      message: "manualStartConnectionLostNotice",
    },
    retry: { transport: true, server: isRetryableStartError },
  }),
  "end-manual": action({
    label: "actionNameEndManual",
    errors: "EndManualReplenishmentErrors",
    popups: {
      ...same(
        [
          "ServerError",
          "ShelvesError",
          "ShelvesAngleCalibrationError",
          "ShelvesInclinationInProgress",
          "ShelfClientTimeout",
          "ShelvesInclinationFailure",
        ],
        retry("manualEndServerErrorNotice")
      ),
      ...home({
        ManualReplenishmentTaskNotFound: ok("manualEndTaskNotFoundNotice"),
        ManualReplenishmentTaskNotInProgress: ok(
          "manualEndTaskNotInProgressNotice"
        ),
        FailedToCloseCurtains: {
          buttons: "close",
          message: "manualEndCurtainCloseFailedNotice",
        },
      }),
      StockLayoutHasErrors: {
        buttons: "close",
        message: "manualEndLaneErrorsNotice",
      },
      // A drink still settling on the scale.
      UnstableWeights: retry("manualEndUnstableWeightsNotice"),
    },
    fallback: retry("manualEndFailedNotice"),
    transport: {
      buttons: "retry",
      cancelAfter: 2,
      message: "manualEndConnectionLostNotice",
    },
    robotRestartPopups: {
      default: ok("manualEndRobotRestartFailedNotice"),
      AnnotationTaskInProgress: ok("manualEndAnnotationTaskNotice"),
    },
    retry: {
      transport: true,
      server: ({ error }) => error === "ServerError",
    },
  }),
  "remove-drink": action({
    label: "actionNameRemoveDrink",
    errors: "RemoveSkusFromStockResult",
    // Queued jobs are the one refusal the app cannot check before submitting.
    popups: {
      DifferentSkuId: ok("removeDrinkLaneChangedNotice"),
      PnpInProgress: ok("removeBlockedRobotBusy"),
      RestockingInProgress: ok("removeBlockedRestocking"),
      RobotMoving: ok("removeBlockedRobotAway"),
      JobQueueNotEmpty: ok("removeBlockedRobotJobsQueued"),
    },
  }),
  "check-lane": action({
    label: "actionNameCheckLane",
    errors: "ForceDiscrepancyResolutionErrors",
    popups: same(
      ["ServerError", "ShelfClientTimeout", "LocationNotFound"],
      retry("laneCheckFailedNotice")
    ),
    fallback: retry("laneCheckFailedNotice"),
    transport: retry("laneCheckFailedNotice"),
  }),
  "save-layout": action({
    label: "actionNameSaveLayout",
    errors: "StartShelfLayoutResponseError",
    popups: {
      CreateShelfLayoutRequestError: ok("layoutRequestPendingNotice"),
      CabinetsDisabledNotAtFarthestEdges: ok("layoutExcludedCabinetEdgeNotice"),
      ...same(
        ["CabinetsToggleStatusInconsistent", "ValidationError"],
        ok("layoutRejectedNotice")
      ),
    },
    fallback: ok("layoutSendFailedNotice"),
    transport: ok("layoutSendFailedNotice"),
    // The request was created; only the stock layout failed.
    alreadyDone: ["AllocateLayoutError"],
  }),
  "curtains-up": { label: "actionNameCurtainsUp" },
  "curtains-down": { label: "actionNameCurtainsDown" },
  "rest-position-top": { label: "actionNameRestPositionTop" },
  "rest-position-bottom": { label: "actionNameRestPositionBottom" },
}
