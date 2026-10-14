import { useEffect, useRef } from "react"

import { useLocation } from "react-router"

import { ROUTES } from "~/config/routes"
import { useRestockRequest } from "~/domains/operations"
import { readShelfState } from "~/domains/shelf"
import { isActiveRequest, isRequestInProgress } from "~/model/request-state"
import { isSamePathname } from "~/utils/pathname"

import { readRestockingState } from "../restocking-store"
import { pauseRestocking } from "../services/pause-restocking"
import { isRestockingEventContextActive } from "../services/restocking-event-context"

/**
 * Mirrors the URL into the store, pauses the restock on leaving its page, and
 * clears the scan once restocking goes inactive. Mounted app-wide, since it
 * reacts to navigation.
 */
export function useRestockingSessionTracking() {
  const { pathname } = useLocation()
  const restockRequest = useRestockRequest()

  const onRestocking = isSamePathname(pathname, ROUTES.restocking().pathname)
  const wasOnRestocking = useRef(onRestocking)
  useEffect(() => {
    readRestockingState().setCurrentPathname(pathname)
    if (wasOnRestocking.current && !onRestocking) {
      void pauseRestocking()
    }
    wasOnRestocking.current = onRestocking
  }, [pathname, onRestocking])

  useEffect(() => {
    const active = isRestockingEventContextActive({
      request: restockRequest,
      pathname,
    })

    if (!active || !onRestocking || !isRequestInProgress(restockRequest)) {
      readRestockingState().invalidateScan()
    }
  }, [pathname, restockRequest, onRestocking])

  // Ending a restock returns the board to normal even while the operator stays on the page.
  const requestOpen = isActiveRequest(restockRequest)
  const wasRequestOpen = useRef(requestOpen)
  useEffect(() => {
    if (wasRequestOpen.current && !requestOpen) {
      readRestockingState().clearRestockingSession()
      readShelfState().selectCell(null)
    }
    wasRequestOpen.current = requestOpen
  }, [requestOpen])
}
