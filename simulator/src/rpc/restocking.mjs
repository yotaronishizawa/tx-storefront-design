/*
 * Restocking sessions and manual replenishment, the requests they open, and
 * the stock-SKU subscription the restocking screen runs on.
 */
import {
  CANNOT_START_MANUAL_REPLENISHMENT,
  CANNOT_START_RESTOCKING,
  canStartManualReplenishment,
  canStartRestocking,
} from "../model/availability.mjs"
import { toRestockingLocationState } from "../model/lanes.mjs"
import {
  addRequest,
  filterRequests,
  findActiveRequest,
  findRequest,
  nextRequestId,
  REQUEST_STATUS,
  REQUEST_TYPE,
  setRequestStatus,
} from "../model/requests.mjs"
import {
  OPERATION_MODE,
  parkRobotForTask,
  WORK_STATUS,
} from "../model/robot.mjs"
import { startRobotWithCapture } from "../model/workflow.mjs"
import { state } from "../state.mjs"
import { withDetailOnlyError, withErrors, withRobotErrors } from "./define.mjs"
import {
  END_MANUAL_REPLENISHMENT_ERRORS,
  END_RESTOCKING_ERRORS,
  HOMEPAGE_ACTIONS_ERRORS,
  PAUSE_RESTOCKING_ERRORS,
  SET_CURRENT_RESTOCKING_SKU_ERRORS,
  START_MANUAL_REPLENISHMENT_ERRORS,
  START_RESTOCKING_ERRORS,
  START_ROBOT_OPERATION_ERRORS,
  STOP_ROBOT_OPERATION_ERRORS,
  SUBSCRIBE_STOCK_SKU_CHANGES_ERRORS,
} from "./errors.mjs"

export const restockingMethods = {
  // `(List<RequestContext>, long)`, written as `{ item1, item2 }`: one page,
  // and the total the filter matched.
  GetFilteredRequestContextsPaginated: ([filter, page, count]) => {
    const requests = filterRequests(filter)
    const size = Number(count ?? 0) > 0 ? Number(count) : requests.length
    const start = Math.max(0, Number(page ?? 0)) * size
    return {
      item1: requests.slice(start, start + size),
      item2: requests.length,
    }
  },

  // `GetHomepageActionsResponse`: each action is `{ reason }`, `0` when it can
  // start. Declared on `IStoreAppService`, which `IRPCHub` extends.
  GetHomepageActions: withErrors(
    () => ({
      error: 0,
      startManualReplenishment: { reason: canStartManualReplenishment() },
      startRestocking: { reason: canStartRestocking() },
    }),
    HOMEPAGE_ACTIONS_ERRORS,
    (error) => ({
      error,
      startManualReplenishment: null,
      startRestocking: null,
    })
  ),

  // The robot stops first, so its failure starts nothing (13 StopRobotOperationError).
  StartRestocking2: withRobotErrors(
    withErrors(
      ([storeId]) => startRestocking(String(storeId ?? "")),
      START_RESTOCKING_ERRORS,
      (error) => ({ error, stopRobotOperationError: 0, restockingId: "" })
    ),
    STOP_ROBOT_OPERATION_ERRORS,
    (code) => ({ error: 13, stopRobotOperationError: code, restockingId: "" })
  ),
  GetCurrentRestockingId2: () => state.currentRestockingId,
  PauseRestocking: withErrors(
    ([, restockingId]) => {
      const request = findRequest(String(restockingId ?? ""))
      if (!request || Number(request.requestType) !== REQUEST_TYPE.restocking)
        return { error: 2 }
      if (Number(request.status) !== REQUEST_STATUS.inProgress)
        return { error: 3 }
      setRequestStatus(request, REQUEST_STATUS.pending)
      return { error: 0 }
    },
    PAUSE_RESTOCKING_ERRORS,
    (error) => ({ error })
  ),
  // The robot restarts last: the restock still ends, only `startRobotOperationError` is set.
  EndRestocking: withRobotErrors(
    withErrors(
      ([, restockingId]) => endRestocking(String(restockingId ?? ""), true),
      END_RESTOCKING_ERRORS,
      (error) => ({ error, startRobotOperationError: 0 })
    ),
    START_ROBOT_OPERATION_ERRORS,
    (code, run) => {
      const answer = run()
      return answer.error
        ? answer
        : { ...answer, startRobotOperationError: code }
    }
  ),

  EndRestocking2: withErrors(
    ([, restockingId]) => endRestocking(String(restockingId ?? ""), false),
    END_RESTOCKING_ERRORS,
    (error) => ({ error, startRobotOperationError: 0 })
  ),
  GetRequestById: ([id]) => findRequest(String(id)) ?? null,

  StartManualReplenishment: withRobotErrors(
    withErrors(
      ([request]) => startManualReplenishment(String(request?.storeId ?? "")),
      START_MANUAL_REPLENISHMENT_ERRORS,
      (error) => ({ error, stopRobotOperationError: 0, restockingId: "" })
    ),
    STOP_ROBOT_OPERATION_ERRORS,
    (code) => ({ error: 11, stopRobotOperationError: code, restockingId: "" })
  ),
  // The task still closes, and `error` is 10 StartRobotOperationError.
  EndManualReplenishment: withRobotErrors(
    withErrors(
      ([request]) =>
        endManualReplenishment(
          String(request?.manualReplenishmentId ?? ""),
          Boolean(request?.startRobotOperationAfter)
        ),
      END_MANUAL_REPLENISHMENT_ERRORS,
      (error) => ({ error, startRobotOperationError: 0, restockingId: "" })
    ),
    START_ROBOT_OPERATION_ERRORS,
    (code, run) => {
      const answer = run()
      return answer.error
        ? answer
        : { ...answer, error: 10, startRobotOperationError: code }
    }
  ),

  SubscribeToStockSkuChanges: withErrors(
    () => ({
      error: 0,
      currentRestockingSku: state.currentRestockingSku || null,
      allLocationsStates: state.stockLocations.map(toRestockingLocationState),
    }),
    SUBSCRIBE_STOCK_SKU_CHANGES_ERRORS,
    (error) => ({ error, currentRestockingSku: null, allLocationsStates: [] })
  ),
  UnsubscribeToStockSkuChanges: () => ({}),
  // A failed shelf publish sets only `errorDetail`; the SKU is not applied.
  SetCurrentRestockingSku: withDetailOnlyError(
    withErrors(
      ([request]) => setCurrentRestockingSku(String(request?.skuId ?? "")),
      SET_CURRENT_RESTOCKING_SKU_ERRORS,
      (error) => ({ error, errorDetail: {}, incompatibleLanes: null })
    ),
    () => ({ error: 0, errorDetail: {}, incompatibleLanes: null })
  ),
}

// `CannotStartRestockingReason.ToStartRestockingResponse`
// (`CannotStartRestockingReason.cs`): the reason, as a `StartRestockingErrors`.
const RESTOCKING_REFUSALS = {
  [CANNOT_START_RESTOCKING.stockLayoutHasErrors]: 8,
  [CANNOT_START_RESTOCKING.manualReplenishmentTaskOpen]: 9,
  [CANNOT_START_RESTOCKING.teleoperationInProgress]: 10,
  [CANNOT_START_RESTOCKING.robotCannotBeStopped]: 2,
  [CANNOT_START_RESTOCKING.capture3dInProgress]: 11,
}

// `CannotStartManualReplenishmentReason.ToStartManualReplenishmentResponse`:
// the reason, as `StartManualReplenishmentErrors` plus a stop-robot error.
const MANUAL_REPLENISHMENT_REFUSALS = {
  [CANNOT_START_MANUAL_REPLENISHMENT.shelfClientTimeout]: {
    error: 6,
    stopRobotOperationError: 0,
  },
  [CANNOT_START_MANUAL_REPLENISHMENT.stockLayoutHasErrors]: {
    error: 8,
    stopRobotOperationError: 0,
  },
  [CANNOT_START_MANUAL_REPLENISHMENT.restockingTaskOpen]: {
    error: 9,
    stopRobotOperationError: 0,
  },
  [CANNOT_START_MANUAL_REPLENISHMENT.teleoperationInProgress]: {
    error: 11,
    stopRobotOperationError: 10,
  },
  [CANNOT_START_MANUAL_REPLENISHMENT.robotCannotBeStopped]: {
    error: 11,
    stopRobotOperationError: 8,
  },
}

function startRestocking(storeId) {
  const refusal = RESTOCKING_REFUSALS[canStartRestocking()]
  if (refusal !== undefined) {
    return { error: refusal, stopRobotOperationError: 0, restockingId: "" }
  }
  if (state.currentRestockingId) {
    const request = findRequest(state.currentRestockingId)
    if (!request)
      return { error: 1, stopRobotOperationError: 0, restockingId: "" }
    setRequestStatus(request, REQUEST_STATUS.inProgress)
    state.currentRestockingSku = ""
    state.robot.status = WORK_STATUS.restPosition
    state.robot.opMode = OPERATION_MODE.restocking
    return {
      error: 0,
      stopRobotOperationError: 0,
      restockingId: state.currentRestockingId,
    }
  }

  state.currentRestockingId = nextRequestId("SIM-RESTOCK")
  addRequest({
    requestId: state.currentRestockingId,
    storeId,
    requestType: REQUEST_TYPE.restocking,
  })
  parkRobotForTask(OPERATION_MODE.restocking)
  return {
    error: 0,
    stopRobotOperationError: 0,
    restockingId: state.currentRestockingId,
  }
}

function endRestocking(restockingId, restart) {
  const request = findRequest(restockingId)
  if (!request || Number(request.requestType) !== REQUEST_TYPE.restocking) {
    return { error: 2, startRobotOperationError: 0 }
  }

  if (
    ![REQUEST_STATUS.inProgress, REQUEST_STATUS.pending].includes(
      Number(request.status)
    )
  )
    return { error: 3, startRobotOperationError: 0 }
  setRequestStatus(request, REQUEST_STATUS.closed)
  state.currentRestockingId = ""
  state.currentRestockingSku = ""
  state.robot.opMode = OPERATION_MODE.forceStopAutomatedJob
  const restarted = restart ? startRobotWithCapture() : { error: 0 }
  return { error: 0, startRobotOperationError: restarted.error }
}

function startManualReplenishment(storeId) {
  const refusal = MANUAL_REPLENISHMENT_REFUSALS[canStartManualReplenishment()]
  if (refusal) {
    return { restockingId: state.currentRestockingId, ...refusal }
  }

  const existing = findActiveRequest(REQUEST_TYPE.manualReplenishment)
  if (existing) {
    setRequestStatus(existing, REQUEST_STATUS.inProgress)
    state.robot.status = WORK_STATUS.restPosition
    state.robot.opMode = 31
    state.curtainsOpen = true
    return {
      error: 0,
      stopRobotOperationError: 0,
      restockingId: existing.requestId,
    }
  }
  const manualId = nextRequestId("SIM-MANUAL")
  addRequest({
    requestId: manualId,
    storeId,
    requestType: REQUEST_TYPE.manualReplenishment,
  })
  parkRobotForTask(OPERATION_MODE.stoppedByStore)
  state.curtainsOpen = true
  return { error: 0, stopRobotOperationError: 0, restockingId: manualId }
}

function endManualReplenishment(manualId, restart) {
  const request = findRequest(manualId)
  if (
    !request ||
    Number(request.requestType) !== REQUEST_TYPE.manualReplenishment
  ) {
    return { error: 2, startRobotOperationError: 0, restockingId: manualId }
  }

  if (
    ![
      REQUEST_STATUS.inProgress,
      REQUEST_STATUS.pending,
      REQUEST_STATUS.closed,
      REQUEST_STATUS.cancelled,
    ].includes(Number(request.status))
  )
    return { error: 3, startRobotOperationError: 0 }
  if (
    ![REQUEST_STATUS.closed, REQUEST_STATUS.cancelled].includes(
      Number(request.status)
    ) &&
    state.manualEndOutcome === "unstable"
  )
    return { error: 12, startRobotOperationError: 0 }
  setRequestStatus(request, REQUEST_STATUS.closed)
  if (state.manualEndOutcome === "curtain-failure")
    return { error: 11, startRobotOperationError: 0 }
  state.curtainsOpen = false
  state.robot.opMode = 31
  const restarted = restart ? startRobotWithCapture() : { error: 0 }
  return {
    error: restarted.error ? 10 : 0,
    startRobotOperationError: restarted.error,
    restockingId: manualId,
  }
}

// A refusal comes from `/sim/faults` (`mode=error`, or `unreadable` for an
// answer with no `error` at all, which the app must also treat as a refusal).
// Accepting the drink places nothing: the operator does that, with
// `/sim/lane/add`, which defaults to this drink.
function setCurrentRestockingSku(skuId) {
  state.currentRestockingSku = skuId

  return {
    error: 0,
    errorDetail: null,
    incompatibleLanes: state.stockLocations
      .filter((location) => location.isBlackList)
      .map((location) => location.id),
  }
}
