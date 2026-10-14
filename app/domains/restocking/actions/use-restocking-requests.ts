import { readAppShellState } from "~/domains/app-shell"
import {
  readOperationsState,
  selectManualReplenishmentRequest,
} from "~/domains/operations"
import { isActiveRequest, isRequestInProgress } from "~/model/request-state"

import { pauseRestocking } from "../services/pause-restocking"
import {
  refuseForLaneErrors,
  refuseManualStart,
  refuseRestockingStart,
} from "../services/restocking-start-checks"

/** Opens the start (or resume) dialog unless a start check refuses, which pauses. */
export function useRequestRestockingStart(): () => void {
  return () => {
    if (refuseRestockingStart()) {
      void pauseRestocking()
      return
    }
    readAppShellState().openDialog("restocking-start")
  }
}

export function useRequestRestockingEnd(): () => void {
  return () => {
    if (!refuseForLaneErrors()) {
      readAppShellState().openDialog("restocking-end")
    }
  }
}

/**
 * Shows the rules for an explicit start or resume. Merely opening a waiting
 * task must not restart it; Retry on a refused start reruns fresh checks.
 */
export function useRequestManualStart(): () => boolean {
  function requestManualStart(): boolean {
    const request = selectManualReplenishmentRequest(readOperationsState())
    if (isActiveRequest(request)) {
      if (isRequestInProgress(request)) return true
      readAppShellState().openDialog("manual-start")
      return false
    }
    if (!refuseManualStart(() => void requestManualStart())) {
      readAppShellState().openDialog("manual-start")
    }
    return false
  }

  return requestManualStart
}
