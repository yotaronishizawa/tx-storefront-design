import { useEffect } from "react"

import {
  getDisplayShelfLocations,
  getSkuRecommendations,
  getStockShelfLocations,
  isOpmConnected,
  onReconnected,
} from "~/api/opm"
import { createLogger } from "~/config/logger"
import { useSession } from "~/domains/session"
import {
  useSelectedStoreId,
  useStoreDataSettled,
} from "~/domains/store-selection"

import { readShelfState } from "../shelf-store"

const logger = createLogger("Shelf Read")

/**
 * Reads the stock layout, the display layout and the recommendations again
 * when the restocking or manual screen opens and after a reconnect: the local
 * shelf hub does not carry OPM's blacklist or layout errors, and another
 * tablet may have changed the targets. Written silently, so changed lanes do
 * not chime or take focus. A failed read keeps what is shown.
 */
export function useShelfReadOnOpen() {
  const session = useSession()
  const storeId = useSelectedStoreId()
  const settled = useStoreDataSettled()
  const token = session?.token

  useEffect(() => {
    if (!token || !storeId || !settled) {
      return
    }
    let open = true

    async function read() {
      if (!isOpmConnected() || !open || !token || !storeId) {
        return
      }
      readShelfState().setRecommendationCountsReading(true)
      const [stock, display, counts] = await Promise.allSettled([
        getStockShelfLocations(storeId, token),
        getDisplayShelfLocations(storeId, token),
        getSkuRecommendations(storeId, token),
      ])
      if (!open) {
        return
      }
      const shelf = readShelfState()
      if (stock.status === "fulfilled") {
        shelf.setStockLocations(stock.value)
      }
      if (display.status === "fulfilled") {
        shelf.setDisplayLocations(display.value)
      }
      if (counts.status === "fulfilled" && counts.value) {
        shelf.setRecommendationCounts(counts.value, storeId)
      }
      shelf.setRecommendationCountsReading(false)
      const failed = [stock, display, counts].filter(
        (result) => result.status === "rejected"
      )
      if (failed.length > 0) {
        logger.warn("Re-reading the shelf on open failed.", failed)
      }
    }

    void read()
    const stopReconnectRead = onReconnected(() => void read())

    return () => {
      open = false
      stopReconnectRead()
      readShelfState().setRecommendationCountsReading(false)
    }
  }, [settled, storeId, token])
}
