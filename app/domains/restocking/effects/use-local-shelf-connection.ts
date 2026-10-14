import { useEffect } from "react"

import { localShelf } from "~/api/stock-shelf"

import { readRestockingState } from "../restocking-store"

/**
 * Opens the local stock-shelf connection and tracks whether it is up. Must stay
 * mounted app-wide: unmounting it on navigation would drop the connection.
 */
export function useLocalShelfConnection() {
  useEffect(() => {
    const unsubscribe = localShelf.subscribeConnectionState((connected) => {
      readRestockingState().setLocalShelfConnected(connected)
    })

    void localShelf.start().catch(() => undefined)

    return unsubscribe
  }, [])
}
