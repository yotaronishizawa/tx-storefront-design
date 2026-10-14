import { useEffect, useRef } from "react"

import {
  getSmartShelvesStatus,
  onReconnected,
  subscribeToSmartShelvesStatus,
} from "~/api/opm"
import { localShelf } from "~/api/stock-shelf"
import { createLogger } from "~/config/logger"
import { useSession } from "~/domains/session"
import { useSelectedStoreId } from "~/domains/store-selection"
import { scanFromShelfStatus } from "~/model/scanner-scan"

import { useRestockingStore } from "../restocking-store"
import {
  createPolledScanFilter,
  createRestockingScanGate,
  toastLocalShelfScan,
} from "../services/restocking-scan-gate"
import {
  clearScannerConnection,
  createScannerConnectionTracker,
  markScannerConnectionUnknown,
} from "../services/scanner-connection-status"

const logger = createLogger("Restocking OPM")

/**
 * Receives scans from the local shelf hub, or from OPM when the hub is down,
 * and tracks shelf and scanner connection from OPM. Mounted app-wide: the
 * footer shows the scanner everywhere and a scan mid-navigation must not be lost.
 */
export function useRestockingScannerEvents() {
  const session = useSession()
  const selectedStoreId = useSelectedStoreId()
  const localStockShelfConnected = useRestockingStore(
    (state) => state.localShelfConnected
  )

  // Outlive the effect, so a resubscribe never replays a scan already handled.
  const processingScanRef = useRef("")
  const processedScansRef = useRef<Map<string, number>>(new Map())

  useEffect(() => {
    markScannerConnectionUnknown()
    if (!session || !selectedStoreId) {
      clearScannerConnection()
      return
    }

    const storeId = selectedStoreId
    const token = session.token
    let cancelled = false
    let unsubscribeOpmStatus: (() => Promise<void>) | undefined
    // Scans come from OPM only while the hub is down; connection status always
    // comes from OPM, so the indicators never flip with the hub.
    const scansFromOpm = !localStockShelfConnected

    const connection = createScannerConnectionTracker(storeId)
    // Reads and pushed statuses both carry the same cached last scan. Share
    // one filter so a later status cannot replay it after the gate cache expires.
    const isNewStatusScan = createPolledScanFilter(storeId, Date.now())
    const handleRestockingScan = createRestockingScanGate({
      storeId,
      processingRef: processingScanRef,
      processedScans: processedScansRef.current,
    })

    // Read once, then kept current by the subscription, as in the store app.
    async function readSmartShelvesStatus() {
      try {
        const status = await getSmartShelvesStatus(storeId, token)
        if (cancelled) {
          return
        }
        connection.statusReceived(status)
        const scan = scansFromOpm && status ? scanFromShelfStatus(status) : null
        if (!scan || !isNewStatusScan(scan)) {
          return
        }
        logger.debug("smart shelves read scan received", { status, storeId })
        handleRestockingScan(scan, "opm-read")
      } catch (caught) {
        if (!cancelled) {
          connection.readFailed(caught)
        }
      }
    }

    const unsubscribeSkuScanned = localShelf.subscribeSkuScanned((scan) => {
      toastLocalShelfScan(scan, storeId, processingScanRef)
    })
    const unsubscribeScanProcessed = localShelf.subscribeScannerScanProcessed(
      (scan) => {
        handleRestockingScan(scan, "local-signalr-processed")
      }
    )

    void subscribeToSmartShelvesStatus(storeId, token, {
      onStatus: (status) => {
        if (!cancelled) {
          connection.statusReceived(status)
        }
      },
      onScannerStatus: (status) => {
        const scan = scanFromShelfStatus(status)
        if (scan && !cancelled && scansFromOpm && isNewStatusScan(scan)) {
          handleRestockingScan(scan, "opm-signalr-status")
        }
      },
    })
      .then((unsubscribe) => {
        if (cancelled) {
          void unsubscribe()
          return
        }
        logger.debug("smart shelves status subscribed", { storeId })
        unsubscribeOpmStatus = unsubscribe
      })
      .catch((caught) => {
        if (!cancelled) {
          connection.subscriptionFailed(caught)
        }
      })

    void readSmartShelvesStatus()
    const stopReconnectRead = onReconnected(() => void readSmartShelvesStatus())

    return () => {
      cancelled = true
      stopReconnectRead()
      unsubscribeSkuScanned()
      unsubscribeScanProcessed()
      void unsubscribeOpmStatus?.()
    }
    // `session?.token`, not `session`: a fresh object with the same token must not rebuild the scanner mid-shift.
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [localStockShelfConnected, selectedStoreId, session?.token])
}
