import type { RequestContext } from "~/api/opm/schemas"
import { ROUTES } from "~/config/routes"
import { readAppShellState } from "~/domains/app-shell"
import { readOperationsState, selectRestockRequest } from "~/domains/operations"
import { isRequestInProgress } from "~/model/request-state"
import { isSamePathname } from "~/utils/pathname"

import { readRestockingState } from "../restocking-store"

type RestockingEventContext = {
  request: RequestContext | undefined
  pathname: string
}

/**
 * On the restocking page, or a restock in progress. Not the robot's mode: it
 * stays `Restocking` through a pause.
 */
export function isRestockingEventContextActive(
  context: RestockingEventContext
) {
  return (
    isSamePathname(context.pathname, ROUTES.restocking().pathname) ||
    isRequestInProgress(context.request)
  )
}

/**
 * Read at event time, never captured: the scanner and lane subscriptions are
 * long-lived, and re-subscribing on every page change would drop events.
 */
export function isRestockingActive(): boolean {
  return isRestockingEventContextActive({
    request: selectRestockRequest(readOperationsState()),
    pathname: readRestockingState().currentPathname,
  })
}

export function isOnRestockingPage(): boolean {
  return isSamePathname(
    readRestockingState().currentPathname,
    ROUTES.restocking().pathname
  )
}

export function isRestockInProgress(): boolean {
  return isRequestInProgress(selectRestockRequest(readOperationsState()))
}

/**
 * Whether a scan may set the restocking drink: only with a restock in
 * progress (OPM would also take one for a paused restock), and not behind the
 * Start/Resume dialog, which after a reload sits over a restock in progress.
 */
export function canApplyRestockingScan(): boolean {
  return (
    isRestockingScanContextActive() &&
    readAppShellState().activeDialog !== "restocking-start"
  )
}

/** Paused/restoring work must not accept a new scan from a stale robot mode. */
export function isRestockingScanContextActive(): boolean {
  const context = {
    request: selectRestockRequest(readOperationsState()),
    pathname: readRestockingState().currentPathname,
  }
  return (
    isSamePathname(context.pathname, ROUTES.restocking().pathname) &&
    isRequestInProgress(context.request) &&
    !readAppShellState().busyAction &&
    readAppShellState().activeDialog !== "restocking-start"
  )
}
