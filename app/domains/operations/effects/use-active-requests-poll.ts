import { useEffect } from "react"

import { onReconnected } from "~/api/opm"
import { useSession } from "~/domains/session"
import { useSelectedStore } from "~/domains/store-selection"

import { refreshRequests } from "../services/active-requests"

const REQUEST_POLL_INTERVAL_MS = 5000

/** Keeps the request list warm while a store is selected, and reads it again on reconnect. */
export function useActiveRequestsPoll() {
  const agentId = useSession()?.agentId ?? ""
  const storeId = useSelectedStore()?.id ?? ""

  useEffect(() => {
    if (!agentId || !storeId) {
      return
    }

    const refresh = () => void refreshRequests().catch(() => undefined)
    const interval = window.setInterval(refresh, REQUEST_POLL_INTERVAL_MS)
    const stopReconnectRefresh = onReconnected(refresh)

    return () => {
      window.clearInterval(interval)
      stopReconnectRefresh()
    }
  }, [agentId, storeId])
}
