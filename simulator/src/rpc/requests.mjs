/*
 * The request lifecycle a store drives by hand: store requests an operator
 * sends, and cancelling or skipping the restock after a layout change.
 */
import {
  findActiveRequest,
  findRequest,
  readRequestStatus,
  REQUEST_STATUS,
  REQUEST_TYPE,
  setRequestStatus,
} from "../model/requests.mjs"
import { startRobotWithCapture } from "../model/workflow.mjs"
import { state } from "../state.mjs"
import { HubException, withErrors } from "./define.mjs"
import { SKIP_RESTOCKING_ERRORS } from "./errors.mjs"

// `UnableToCancelShelfLayoutRequestReason` (`Task/Entities/UnableToCancelShelfLayoutRequestReason.cs`).
const UNABLE_TO_CANCEL_LAYOUT = {
  none: 0,
  layoutCheckUnfinished: 10,
  restockUnfinished: 20,
  annotationExists: 30,
}

export const requestMethods = {
  // Answers the updated `RequestContext`. OPM does not check the transition;
  // an unknown request throws (`RequestContextUsecase.UpdateRequestStatus`).
  UpdateRequestStatus: ([requestId, agentId, status]) => {
    const request = findRequest(String(requestId ?? ""))
    const next = readRequestStatus(status)
    if (!request || Number.isNaN(next)) {
      throw new HubException(`Request ${requestId} not found.`)
    }
    if (Number(request.status) === next) {
      return request
    }
    return setRequestStatus(request, next, String(agentId ?? ""))
  },

  // `ShelfLayoutRequestUsecase.CancelShelfLayoutRequest`: refuses with the
  // reason, or cancels the layout change with its layout check and restock.
  CancelShelfLayoutChangeRequestV2: ([requestId, , agentId]) =>
    cancelLayoutChange(requestId, agentId),
  // V1 answers a bool where V2 answers the reason.
  CancelShelfLayoutChangeRequest: ([requestId, , agentId]) =>
    cancelLayoutChange(requestId, agentId) === UNABLE_TO_CANCEL_LAYOUT.none,
  CanCancelShelfLayoutChangeRequest: () =>
    canCancelLayoutChange() === UNABLE_TO_CANCEL_LAYOUT.none,
  CanCancelShelfLayoutChangeRequestV2: () => canCancelLayoutChange(),

  // OPM only restarts the robot, which closes the layout change.
  SkipRestocking: withErrors(
    () => skipRestocking(),
    SKIP_RESTOCKING_ERRORS,
    (error) => ({ error, startRobotOperationError: 0 })
  ),
}

function cancelLayoutChange(requestId, agentId) {
  const reason = canCancelLayoutChange()
  if (reason !== UNABLE_TO_CANCEL_LAYOUT.none) {
    return reason
  }
  const agent = String(agentId ?? "")
  for (const request of [
    findRequest(String(requestId ?? "")),
    findActiveRequest(REQUEST_TYPE.layoutCheck),
    findActiveRequest(REQUEST_TYPE.restocking),
  ]) {
    if (request) {
      setRequestStatus(request, REQUEST_STATUS.cancelled, agent)
    }
  }
  return UNABLE_TO_CANCEL_LAYOUT.none
}

/** `CanCancelShelfLayoutRequest`, in OPM's order. */
function canCancelLayoutChange() {
  const layoutCheck = findActiveRequest(REQUEST_TYPE.layoutCheck)
  if (
    layoutCheck &&
    [REQUEST_STATUS.inProgress, REQUEST_STATUS.pending].includes(
      Number(layoutCheck.status)
    )
  ) {
    return UNABLE_TO_CANCEL_LAYOUT.layoutCheckUnfinished
  }
  const restock = findActiveRequest(REQUEST_TYPE.restocking)
  if (restock && Number(restock.status) !== REQUEST_STATUS.notInProgress) {
    return UNABLE_TO_CANCEL_LAYOUT.restockUnfinished
  }
  if (findActiveRequest(REQUEST_TYPE.annotation)) {
    return UNABLE_TO_CANCEL_LAYOUT.annotationExists
  }
  return UNABLE_TO_CANCEL_LAYOUT.none
}

function skipRestocking() {
  if (state.currentRestockingId) {
    return { error: 2, startRobotOperationError: 0 }
  }
  const result = startRobotWithCapture()
  return { error: result.error ? 4 : 0, startRobotOperationError: result.error }
}
