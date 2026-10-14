import type { SmartShelvesStatus } from "~/api/opm/schemas"
import { createLogger } from "~/config/logger"
import { readShelfState } from "~/domains/shelf"
import { nextShelfClientReport } from "~/model/shelf-client"

import { readRestockingState } from "../restocking-store"

const logger = createLogger("Restocking OPM")

/** Status is unknown until OPM answers for the new store or session. */
export function markScannerConnectionUnknown() {
  readRestockingState().setSmartShelvesStatusKnown(false)
  readRestockingState().setShelvesFlat(false)
  readShelfState().setShelfClientReport(null)
}

/** No store or no session: nothing can be connected. */
export function clearScannerConnection() {
  markScannerConnectionUnknown()
  readRestockingState().setScannerConnected(false)
  readShelfState().setSmartShelfConnected(false)
}

/**
 * Shelf and scanner connection, always from OPM's smart shelves status, so the
 * indicators never flip with the local hub.
 */
export function createScannerConnectionTracker(storeId: string) {
  return {
    statusReceived(status: SmartShelvesStatus | null) {
      const shelf = readShelfState()
      shelf.setSmartShelfConnected(status?.isConnected ?? false)
      shelf.setShelfClientReport(
        status
          ? nextShelfClientReport(
              shelf.shelfClientReport,
              {
                reportedAt: status.reportedAt,
                version: status.shelfClientVersion,
              },
              Date.now()
            )
          : null
      )
      const restocking = readRestockingState()
      // No status means the scanner is unplugged, not that nothing changed.
      restocking.setScannerConnected(
        status?.scannerStatus?.isConnected ?? false
      )
      restocking.setShelvesFlat(status?.mode === "Restocking")
      restocking.setSmartShelvesStatusKnown(true)
    },

    readFailed(caught: unknown) {
      logger.debug("smart shelves status read failed", {
        error: caught,
        storeId,
      })
      readRestockingState().setScannerConnected(false)
    },

    subscriptionFailed(caught: unknown) {
      readRestockingState().setScannerConnected(false)
      logger.warn(
        "OPM smart shelves status subscription is unavailable.",
        caught
      )
    },
  }
}
