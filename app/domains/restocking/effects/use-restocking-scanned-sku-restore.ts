import { useEffect } from "react"

import { localShelf, type StockShelfScan } from "~/api/stock-shelf"
import { createLogger } from "~/config/logger"
import { useIsDialogOpen } from "~/domains/app-shell"

import { readRestockingState, useRestockingStore } from "../restocking-store"
import { isRestockingScanContextActive } from "../services/restocking-event-context"
import { useActiveRestockRequestId } from "../use-restocking"

const logger = createLogger("Restocking Scan")

/**
 * Puts the shelf hub's last scan back on the "Scanned drink" card after a
 * reconnect. A pause/resume invalidates the current drink; the first new scan
 * must arrive before a cached hub scan may be restored. Otherwise a reply for
 * the same request ID could put back the SKU which StartRestocking2 cleared.
 */
export function useRestockingScannedSkuRestore() {
  // Readback is guarded below by the active page and in-progress request.
  const requestId = useActiveRestockRequestId()
  const localShelfConnected = useRestockingStore(
    (state) => state.localShelfConnected
  )
  const awaitingStart = useIsDialogOpen("restocking-start")

  useEffect(() => {
    if (
      !requestId ||
      !localShelfConnected ||
      awaitingStart ||
      !isRestockingScanContextActive()
    ) {
      return
    }
    const generation = readRestockingState().scanGeneration
    let cancelled = false
    localShelf
      .getLatestScan()
      .then((scan) => {
        if (
          cancelled ||
          generation !== readRestockingState().scanGeneration ||
          !isRestockingScanContextActive() ||
          !isRestorableScan(scan, requestId)
        ) {
          return
        }
        logger.debug("restoring the shelf hub's scanned drink", {
          requestId,
          skuId: scan.resolvedSkuId,
        })
        readRestockingState().restoreScannedSku(scan.resolvedSkuId)
      })
      .catch((caught) => {
        logger.warn("Failed to read the shelf hub's latest scan.", caught)
      })
    return () => {
      cancelled = true
    }
  }, [awaitingStart, localShelfConnected, requestId])
}

/** A scan the hub applied to this restock, of a drink not already shown. */
function isRestorableScan(
  scan: StockShelfScan | null,
  requestId: string
): scan is StockShelfScan {
  if (!scan?.restockingSkuApplied || !scan.resolvedSkuId) {
    return false
  }
  if (!readRestockingState().scanRestorationAllowed) return false
  const sameRequest =
    scan.restockingSessionId.toLowerCase() === requestId.toLowerCase()
  const alreadyShown = readRestockingState().scannedSkuId === scan.resolvedSkuId
  return sameRequest && !alreadyShown
}
