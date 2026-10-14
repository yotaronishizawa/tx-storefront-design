import { useEffect, useRef } from "react"

import { useNavigate } from "react-router"

import { ROUTES } from "~/config/routes"
import {
  useManualReplenishmentActive,
  useManualReplenishmentRequest,
} from "~/domains/operations"
import {
  readRestockingState,
  verifyManualRequestClosed,
} from "~/domains/restocking"
import { useSession } from "~/domains/session"

/** Sends the operator home only after the exact task is confirmed closed elsewhere. */
export function useLeaveWhenManualCloses() {
  const navigate = useNavigate()
  const session = useSession()
  const active = useManualReplenishmentActive()
  const requestId = useManualReplenishmentRequest()?.requestId ?? ""
  const lastRequestId = useRef(active ? requestId : "")

  useEffect(() => {
    if (active) {
      lastRequestId.current = requestId
      return
    }
    const closingRequestId = lastRequestId.current
    if (!session || !closingRequestId) return

    let cancelled = false
    let retry: ReturnType<typeof setTimeout> | undefined
    async function verifyClosure() {
      // Own finish and continuous MR→RS navigate from their dialog after readback.
      if (readRestockingState().endingManualRequestId === closingRequestId)
        return
      try {
        const closed = await verifyManualRequestClosed(closingRequestId)
        if (cancelled) return
        if (
          closed &&
          readRestockingState().endingManualRequestId !== closingRequestId
        ) {
          lastRequestId.current = ""
          void navigate(ROUTES.home().pathname)
          return
        }
      } catch {
        // A failed read or a missing list item is not evidence of completion.
      }
      if (!cancelled) retry = setTimeout(() => void verifyClosure(), 5000)
    }
    void verifyClosure()
    return () => {
      cancelled = true
      clearTimeout(retry)
    }
  }, [active, navigate, requestId, session])
}
