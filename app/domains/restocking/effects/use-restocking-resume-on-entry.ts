import { useEffect, useRef, useState } from "react"

import { readAppShellState } from "~/domains/app-shell"
import {
  readOperationsState,
  refreshRequests,
  selectRestockRequest,
} from "~/domains/operations"
import {
  readShelfState,
  selectMisplacedStock,
  useStockLocationsLoaded,
} from "~/domains/shelf"
import { translate } from "~/initializer/i18n"
import { isActiveRequest } from "~/model/request-state"
import { hasLaneErrors } from "~/model/shelf"

import { useRequestRestockingStart } from "../actions/use-restocking-requests"
import { readRestockingState, useRestockingStore } from "../restocking-store"
import { pauseRestocking, pauseSettled } from "../services/pause-restocking"
import { consumeMisplacedStockAcknowledgement } from "../services/restocking-entry-notice"

/**
 * On entry: first asks the operator to take out drinks no longer on display,
 * if any; then, with a restock open, pauses it if any lane has an error, or
 * runs the start sequence again.
 */
export function useRestockingResumeOnEntry() {
  const requestRestockingStart = useRequestRestockingStart()
  const stockLoaded = useStockLocationsLoaded()
  const statusKnown = useRestockingStore(
    (state) => state.smartShelvesStatusKnown
  )
  const [requestsFresh, setRequestsFresh] = useState(false)
  const handled = useRef(false)
  const mounted = useRef(true)
  const entryNotice = useRef<AbortController | null>(null)
  useEffect(() => {
    mounted.current = true
    entryNotice.current = new AbortController()
    return () => {
      mounted.current = false
      entryNotice.current?.abort()
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    void pauseSettled()
      .then(() => refreshRequests())
      .then(() => {
        if (!cancelled) {
          setRequestsFresh(true)
        }
      })
      .catch(() => {
        if (!cancelled)
          readAppShellState().setError(translate("workflow.resultUnknown"))
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (handled.current || !requestsFresh || !stockLoaded || !statusKnown) {
      return
    }
    handled.current = true

    async function enter() {
      const entryRequest = selectRestockRequest(readOperationsState())
      const misplacedAcknowledged = consumeMisplacedStockAcknowledgement()
      if (
        !misplacedAcknowledged &&
        selectMisplacedStock(readShelfState()).skuIds.size > 0
      ) {
        const signal = entryNotice.current?.signal
        await readAppShellState().askOperatorWhenIdle(
          {
            buttons: "ok",
            home: false,
            message: translate("layoutLeftoverStockNotice"),
          },
          undefined,
          signal
        )
        if (signal?.aborted) return
        // Left while the notice waited: nothing to resume here.
        if (!mounted.current) {
          return
        }
      }
      const request = selectRestockRequest(readOperationsState())
      // Another start may have completed while the notice waited behind its
      // rules dialog. Only resume the request that was already open on entry.
      if (
        !isActiveRequest(entryRequest) ||
        !isActiveRequest(request) ||
        request?.requestId !== entryRequest?.requestId ||
        request?.status !== entryRequest?.status
      )
        return
      if (hasLaneErrors(readShelfState().stockLocations)) {
        void pauseRestocking()
        return
      }
      const continuationId = readRestockingState().continuedRestockingRequestId
      readRestockingState().setContinuedRestockingRequestId("")
      if (
        continuationId &&
        request?.requestId === continuationId &&
        request.status === "InProgress"
      )
        return
      requestRestockingStart()
    }

    void enter()
  }, [requestRestockingStart, requestsFresh, statusKnown, stockLoaded])
}
