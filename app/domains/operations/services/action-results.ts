import { isUnauthorizedError, ROBOT_REST_POSITION_TIMEOUT } from "~/api/opm"
import {
  decodeOpmError,
  type OpmError,
  type OpmErrorName,
  type StartRobotOperationErrorsName,
} from "~/api/opm/schemas"
import { OPERATIONS_CENTER_PHONE } from "~/config/app"
import { createLogger } from "~/config/logger"
import {
  readAppShellState,
  type ActionPrompt,
  type PromptButtons,
  type PromptChoice,
} from "~/domains/app-shell"
import { translate } from "~/initializer/i18n"
import type { BusyTask, StoreAction } from "~/types/busy-action"
import { errorMessage, OperatorNotice } from "~/utils/error-message"
import { asRecord } from "~/utils/record"

import {
  STORE_ACTIONS,
  type ErrorPopup,
  type ResponseFailure,
  type StoreActionSpec,
} from "./store-actions"

const logger = createLogger("Store Action")

const RETRY_BUTTONS: readonly PromptButtons[] = [
  "retry",
  "retry-cancel",
  "yes-no",
]

/** The command landed, but the robot did not restart. */
export type RobotRestartFailure = {
  kind: "robot-restart-failed"
  codes: string[]
  robotError: StartRobotOperationErrorsName
}

type ThrownFailure = { kind: "thrown"; cause: unknown }

export type ActionFailure =
  | ResponseFailure
  | RobotRestartFailure
  | ThrownFailure

/** Preserve OPM's popup and support codes through a multi-step workflow. */
export class ActionFailureNotice extends OperatorNotice {
  constructor(
    readonly action: StoreAction,
    readonly failure: ActionFailure,
    readonly prefix = ""
  ) {
    super(prefix || "Operation failed")
  }
}

/** `message` with its support codes on a new line. */
export function withSupportCodes(message: string, codes: string[]): string {
  if (codes.length === 0) {
    return message
  }
  const line = codes.map((code) => translate("supportCode", { code }))
  return `${message}\n${line.join(" ")}`
}

export function getActionResponseError(
  action: StoreAction,
  result: unknown,
  { allowAlreadyDone = true } = {}
): ResponseFailure | RobotRestartFailure | null {
  const { alreadyDone, errors } = STORE_ACTIONS[action]
  const record = asRecord(result)
  const requiresError = [
    "save-layout",
    "start-restocking",
    "end-restocking",
    "start-manual",
    "end-manual",
    "start-auto-pnp",
    "stop-auto-pnp",
  ].includes(action)
  if (
    requiresError &&
    typeof record.error !== "number" &&
    typeof record.error !== "string"
  ) {
    return {
      kind: "failed",
      codes: [],
      error: "UnrecognizedResponse",
      stopRobotError: "",
    }
  }
  if (
    ["end-restocking", "end-manual"].includes(action) &&
    typeof record.startRobotOperationError !== "number" &&
    typeof record.startRobotOperationError !== "string"
  ) {
    return {
      kind: "failed",
      codes: [],
      error: "UnrecognizedResponse",
      stopRobotError: "",
    }
  }
  const error = decodeOpmError(record.error, errors)
  const restart = decodeOpmError(
    record.startRobotOperationError,
    "StartRobotOperationErrors"
  )
  const refused =
    error !== null && !(allowAlreadyDone && alreadyDone?.includes(error.name))

  if (!refused) {
    return restart ? robotRestartFailure(restart, []) : null
  }

  // The task closed; only the robot restart failed, if it names why.
  if (error.name === "StartRobotOperationError") {
    return restart
      ? robotRestartFailure(restart, codesOf(error))
      : {
          kind: "failed",
          codes: codesOf(error),
          error: error.name,
          stopRobotError: "",
        }
  }

  const stop =
    error.name === "StopRobotOperationError"
      ? decodeOpmError(
          record.stopRobotOperationError,
          "StopRobotOperationErrors"
        )
      : null
  return {
    kind: "failed",
    codes: [...codesOf(error), ...codesOf(stop)],
    error: error.name,
    stopRobotError: stop?.name ?? "",
  }
}

export function isRetryChoice(
  prompt: ActionPrompt,
  choice: PromptChoice
): boolean {
  return choice === "confirm" && RETRY_BUTTONS.includes(prompt.buttons)
}

/**
 * Raises the popup OPM's answer would, for a refusal worked out locally.
 * Resolves `true` when the operator chose Retry.
 */
export async function askForActionRefusal(
  action: StoreAction,
  response: unknown
): Promise<boolean> {
  const failure = getActionResponseError(action, response)
  if (!failure) {
    return false
  }
  const prompt = getActionPrompt(action, failure, 1)
  const choice = await readAppShellState().askOperator(prompt)
  return isRetryChoice(prompt, choice)
}

function robotRestartFailure(
  restart: OpmError<OpmErrorName<"StartRobotOperationErrors">>,
  leadingCodes: string[]
): RobotRestartFailure {
  return {
    kind: "robot-restart-failed",
    codes: [...leadingCodes, ...codesOf(restart)],
    robotError: restart.name,
  }
}

/** The popup for one failure; `failures` counts this run's failures so far. */
export function getActionPrompt(
  action: StoreAction,
  failure: ActionFailure,
  failures: number
): ActionPrompt {
  const spec = STORE_ACTIONS[action]
  const label = translate(spec.label)

  if (failure.kind === "thrown") {
    if (failure.cause instanceof ActionFailureNotice) {
      const nested = failure.cause
      const prompt = getActionPrompt(nested.action, nested.failure, failures)
      return {
        ...prompt,
        message: [nested.prefix, prompt.message].filter(Boolean).join(" "),
      }
    }
    if (spec.transport && isTransportError(failure.cause)) {
      return toPrompt(spec.transport, [], failures)
    }
    return okPrompt(actionErrorMessage(failure.cause))
  }

  if (failure.kind === "robot-restart-failed") {
    const popup =
      spec.robotRestartPopups?.[failure.robotError] ??
      spec.robotRestartPopups?.default
    if (popup) {
      return toPrompt(popup, failure.codes, failures)
    }
    const message = translate("actionRobotRestartFailed", { action: label })
    return okPrompt(withSupportCodes(message, failure.codes))
  }

  const popup = findRefusalPopup(spec, failure) ?? spec.fallback
  if (popup) {
    return toPrompt(popup, failure.codes, failures)
  }

  // With no code, OPM's error name is the best clue.
  if (failure.codes.length === 0) {
    return okPrompt(
      translate("actionFailedWithError", {
        action: label,
        error: failure.error,
      })
    )
  }
  const message = translate("actionFailed", { action: label })
  return okPrompt(withSupportCodes(message, failure.codes))
}

/**
 * Sends `failure` to Sentry. One with a popup written for it is OPM working as
 * designed, so it is only logged; anything else raises an issue.
 */
export function reportActionFailure(
  action: StoreAction,
  failure: ActionFailure
): void {
  const spec = STORE_ACTIONS[action]

  if (failure.kind === "thrown") {
    if (failure.cause instanceof ActionFailureNotice) {
      reportActionFailure(failure.cause.action, failure.cause.failure)
      return
    }
    if (spec.transport && isTransportError(failure.cause)) {
      logger.warn(`${action} lost the connection.`, failure.cause)
      return
    }
    reportThrown(action, failure.cause)
    return
  }

  if (failure.kind === "robot-restart-failed") {
    const message = `${action} left the robot stopped: ${failure.robotError}.`
    const mapped = spec.robotRestartPopups?.[failure.robotError]
    logRefusal(mapped !== undefined, message, failure.codes)
    return
  }

  const message = `${action} refused: ${failure.error}${failure.stopRobotError ? `/${failure.stopRobotError}` : ""}.`
  logRefusal(
    findRefusalPopup(spec, failure) !== undefined,
    message,
    failure.codes
  )
}

/** A throw meant for the operator, or an expired session, is not a fault. */
export function reportThrown(
  action: StoreAction | BusyTask,
  caught: unknown
): void {
  if (caught instanceof OperatorNotice || isUnauthorizedError(caught)) {
    return
  }
  logger.error(`${action} failed.`, caught)
}

function logRefusal(mapped: boolean, message: string, codes: string[]) {
  if (mapped) {
    logger.warn(message, { codes })
  } else {
    logger.error(message, { codes })
  }
}

function findRefusalPopup(
  spec: StoreActionSpec,
  failure: ResponseFailure
): ErrorPopup | undefined {
  if (failure.error === "StopRobotOperationError") {
    return spec.stopRobotPopups?.[failure.stopRobotError]
  }
  return spec.popups?.[failure.error]
}

function okPrompt(message: string): ActionPrompt {
  return { buttons: "ok", home: false, message }
}

function toPrompt(
  popup: ErrorPopup,
  codes: string[],
  failures: number
): ActionPrompt {
  const offersCancel =
    popup.cancelAfter !== undefined && failures > popup.cancelAfter
  return {
    buttons: offersCancel ? "retry-cancel" : popup.buttons,
    home: popup.home ?? false,
    message: withSupportCodes(
      translate(popup.message, { phone: OPERATIONS_CENTER_PHONE }),
      popup.noCode ? [] : codes
    ),
  }
}

/**
 * A throw the app did not raise on purpose, so most likely the connection.
 * Not `Unauthorized`: the client already refreshed the token.
 */
export function isTransportError(error: unknown): boolean {
  return (
    !(error instanceof OperatorNotice) &&
    !isUnauthorizedError(error) &&
    actionErrorMessage(error) === errorMessage(error)
  )
}

/** The popup a landed command raises in place of the "sent" banner, if it has one. */
export function getActionSuccessPrompt(
  action: StoreAction
): ActionPrompt | null {
  const popup = STORE_ACTIONS[action].successPopup
  return popup ? toPrompt(popup, [], 1) : null
}

// Their own dialogs follow, or the screen already shows the result, as in the store app.
const SILENT_SUCCESS_ACTIONS: StoreAction[] = [
  "start-restocking",
  "save-layout",
  "start-manual",
  "end-manual",
  "check-lane",
]

export function getActionSuccessNotice(
  action: StoreAction,
  result: unknown
): string {
  if (SILENT_SUCCESS_ACTIONS.includes(action)) {
    return ""
  }

  const restockingId = String(asRecord(result).restockingId ?? "")
  if (restockingId) {
    return translate("actionSentWithRestockingId", {
      action: translate(STORE_ACTIONS[action].label),
      restockingId,
    })
  }

  return translate("actionSent")
}

export function actionErrorMessage(error: unknown): string {
  const message = errorMessage(error)
  const match = message.match(/Method '([^']+)' is not allowed/)

  if (match) {
    return translate("opmMethodUnavailable", { method: match[1] })
  }

  if (message === ROBOT_REST_POSITION_TIMEOUT) {
    return translate("robotRestPositionTimeout")
  }

  return message
}

/** A name OPM sent that its enum lacks has no value, so no code either. */
function codesOf(error: OpmError | null): string[] {
  return error?.code ? [error.code] : []
}
