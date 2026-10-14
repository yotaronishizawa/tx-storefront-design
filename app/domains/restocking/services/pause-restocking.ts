import { call, getWorkflowRequest } from "~/api/opm"
import { decodeOpmError } from "~/api/opm/schemas"
import { createLogger } from "~/config/logger"
import {
  readOperationsState,
  refreshRequests,
  selectRestockRequest,
} from "~/domains/operations"
import { readSessionState } from "~/domains/session"
import { readStoreSelectionState } from "~/domains/store-selection"
import { errorMessage } from "~/utils/error-message"
import { asRecord } from "~/utils/record"

import { readRestockingState } from "../restocking-store"

const logger = createLogger("Restocking Pause")
let inFlight: Promise<void> = Promise.resolve()
type PauseContext = { requestId: string; storeId: string; token: string }

/** Capture the source task now: a delayed pause must never discover a newer RS task. */
export function pauseRestocking(): Promise<void> {
  readRestockingState().invalidateScan()
  const { session } = readSessionState()
  const storeId = readStoreSelectionState().selectedStoreId
  const request = selectRestockRequest(readOperationsState())
  if (
    !session ||
    !storeId ||
    request?.storeId !== storeId ||
    request.status !== "InProgress"
  )
    return inFlight
  const context = {
    requestId: request.requestId,
    storeId,
    token: session.token,
  }
  inFlight = inFlight.then(() => sendPause(context))
  return inFlight
}

/** Start must await every previously queued pause before resuming the same task. */
export function pauseSettled(): Promise<void> {
  return inFlight
}

function isCurrent(context: PauseContext) {
  return (
    readStoreSelectionState().selectedStoreId === context.storeId &&
    readSessionState().session?.token === context.token
  )
}

async function sendPause(context: PauseContext): Promise<void> {
  try {
    if (!isCurrent(context)) return
    const request = await getWorkflowRequest(context.requestId, context.token)
    if (
      !isCurrent(context) ||
      request.requestId !== context.requestId ||
      request.storeId !== context.storeId ||
      request.requestType !== "Restock" ||
      request.status !== "InProgress"
    )
      return
    const response = await call(
      "PauseRestocking",
      [context.storeId, context.requestId],
      context.token
    )
    const rawError = asRecord(response).error
    const error = decodeOpmError(rawError, "PauseRestockingErrors")
    if (rawError === undefined || rawError === null || error)
      logger.warn(
        "PauseRestocking not confirmed",
        error ?? "Unreadable response"
      )
    if (isCurrent(context)) await refreshRequests()
  } catch (error) {
    // Navigation remains possible; never replay an uncertain command automatically.
    logger.warn("PauseRestocking failed", errorMessage(error))
  }
}
