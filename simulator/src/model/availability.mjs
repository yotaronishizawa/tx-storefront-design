/*
 * Whether restocking or manual replenishment can start, and why not. OPM runs
 * the same check for `GetHomepageActions` and again inside `StartRestocking2`
 * and `StartManualReplenishment`, so all three answer from here.
 */
import { state } from "../state.mjs"
import { findActiveRequest, REQUEST_TYPE } from "./requests.mjs"
import { OPERATION_MODE, WORK_STATUS } from "./robot.mjs"

// `Operation/Gateways/StoreApp/HomepageActions/CannotStartRestockingReason.cs`.
export const CANNOT_START_RESTOCKING = {
  available: 0,
  stockLayoutHasErrors: 3,
  manualReplenishmentTaskOpen: 4,
  teleoperationInProgress: 5,
  robotCannotBeStopped: 6,
  capture3dInProgress: 7,
}

// `Operation/Gateways/StoreApp/HomepageActions/CannotStartManualReplenishmentReason.cs`.
export const CANNOT_START_MANUAL_REPLENISHMENT = {
  available: 0,
  shelfClientTimeout: 3,
  stockLayoutHasErrors: 5,
  restockingTaskOpen: 6,
  teleoperationInProgress: 7,
  robotCannotBeStopped: 8,
}

/**
 * `StartRestockingUsecase.CanStartRestocking`. Lane errors are left out: OPM
 * checks them only for a client that says it is `StoreApp` ≥ 4.9.0
 * (`StockLayoutConstraints.cs:16`), and the storefront cannot say so.
 */
export function canStartRestocking() {
  if (findActiveRequest(REQUEST_TYPE.manualReplenishment)) {
    return CANNOT_START_RESTOCKING.manualReplenishmentTaskOpen
  }
  const status = Number(state.robot.status)
  if (isTeleoperation(status)) {
    return CANNOT_START_RESTOCKING.teleoperationInProgress
  }
  if (status === WORK_STATUS.automationCapture3d) {
    return CANNOT_START_RESTOCKING.capture3dInProgress
  }
  if (status === WORK_STATUS.notStartedYet && !inMaintenance()) {
    return CANNOT_START_RESTOCKING.robotCannotBeStopped
  }
  return CANNOT_START_RESTOCKING.available
}

/** `ManualReplenishmentUsecase.CanStartManualReplenishment`, in its order. */
export function canStartManualReplenishment() {
  if (findActiveRequest(REQUEST_TYPE.restocking)) {
    return CANNOT_START_MANUAL_REPLENISHMENT.restockingTaskOpen
  }
  const status = Number(state.robot.status)
  if (isTeleoperation(status)) {
    return CANNOT_START_MANUAL_REPLENISHMENT.teleoperationInProgress
  }
  if (status === WORK_STATUS.notStartedYet && !inMaintenance()) {
    return CANNOT_START_MANUAL_REPLENISHMENT.robotCannotBeStopped
  }
  if (hasConstraintErrors()) {
    return CANNOT_START_MANUAL_REPLENISHMENT.stockLayoutHasErrors
  }
  if (!state.shelfConnected) {
    return CANNOT_START_MANUAL_REPLENISHMENT.shelfClientTimeout
  }
  return CANNOT_START_MANUAL_REPLENISHMENT.available
}

/** `Utility.HasLocationErrorOnStartRestocking`: only a drink too big for its lane counts. */
function hasConstraintErrors() {
  return state.stockLocations.some((location) =>
    (location.errors ?? []).some((error) => "invalidSkuId" in error)
  )
}

function isTeleoperation(status) {
  return (
    status === WORK_STATUS.requestingTeleoperation ||
    status === WORK_STATUS.teleoperation
  )
}

function inMaintenance() {
  return Number(state.robot.opMode) === OPERATION_MODE.maintenance
}
