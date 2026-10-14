import { useEffect, useEffectEvent, useLayoutEffect, useRef } from "react"

import { useLocation } from "react-router"

import { getSmartShelvesStatus } from "~/api/opm"
import { localShelf } from "~/api/stock-shelf"
import { createLogger } from "~/config/logger"
import { ROUTES } from "~/config/routes"
import { readSessionState, useSession } from "~/domains/session"
import {
  readStoreSelectionState,
  useSelectedStoreId,
} from "~/domains/store-selection"
import { getScanJanCode, scanFromShelfStatus } from "~/model/scanner-scan"
import type { ScannerScan } from "~/model/scanner-scan"
import { normalizeJanCode } from "~/model/sku"
import { isSamePathname } from "~/utils/pathname"

const logger = createLogger("Layout product scan")
const POLL_INTERVAL_MS = 2_000
const MAX_POLLED_SCAN_AGE_MS = 5_000
const EVENT_CACHE_TTL_MS = 30_000
const CHANNEL_DEDUPE_MS = 2_500

type LayoutProductScanOptions = {
  /** Enable only while the editor can accept a product search for a selected face. */
  enabled: boolean
  onScan: (code: string) => void
}

/** Reads barcode input for product search. It never applies a restocking SKU. */
export function useLayoutProductScan({
  enabled,
  onScan,
}: LayoutProductScanOptions): void {
  const { pathname } = useLocation()
  const token = useSession()?.token
  const storeId = useSelectedStoreId()
  const isEditing = isSamePathname(pathname, ROUTES.edit().pathname)
  const enabledAt = useRef<number | null>(null)

  useLayoutEffect(() => {
    enabledAt.current = enabled && isEditing ? Date.now() : null
  }, [enabled, isEditing, storeId, token])

  const canAcceptScan = useEffectEvent(() => enabled && isEditing)

  // Keep the latest selection callback without restarting the scanner when the
  // editor filters its product list or selects another face.
  const deliverScan = useEffectEvent((code: string) => {
    if (enabled && isEditing) {
      onScan(code)
    }
  })

  useEffect(() => {
    if (!isEditing || !token || !storeId) {
      return
    }

    const activeToken = token
    const processedEvents = new Map<string, number>()
    let cancelled = false
    let localShelfConnected = false
    let polling = false
    let pollFailureLogged = false
    let latestPolledEventId = ""
    let previousScan: {
      code: string
      source: "local" | "opm"
      receivedAt: number
    } | null = null

    function isCurrentContext() {
      return (
        !cancelled &&
        readSessionState().session?.token === activeToken &&
        readStoreSelectionState().selectedStoreId === storeId
      )
    }

    function receiveScan(scan: ScannerScan, source: "local" | "opm") {
      if (
        !isCurrentContext() ||
        !canAcceptScan() ||
        (scan.storeId && scan.storeId !== storeId)
      ) {
        return
      }

      const code = normalizeJanCode(getScanJanCode(scan))
      if (!code) {
        return
      }

      const now = Date.now()
      const keys = [
        scan.eventId ? `event:${scan.eventId}` : "",
        scan.latestScannedAt ? `time:${scan.latestScannedAt}:${code}` : "",
      ].filter(Boolean)
      for (const [key, receivedAt] of processedEvents) {
        if (now - receivedAt > EVENT_CACHE_TTL_MS) {
          processedEvents.delete(key)
        }
      }

      if (keys.some((key) => processedEvents.has(key))) {
        return
      }
      for (const key of keys) {
        processedEvents.set(key, now)
      }
      // A disconnect can deliver one scan from the local hub, then its cached
      // OPM status with a different event id. Do not reopen the picker twice.
      if (
        previousScan?.code === code &&
        previousScan.source !== source &&
        now - previousScan.receivedAt < CHANNEL_DEDUPE_MS
      ) {
        return
      }

      previousScan = { code, source, receivedAt: now }
      // Acceptance/error fields describe restocking, not whether this barcode
      // may be used to search the product catalog.
      deliverScan(code)
    }

    async function pollScannerStatus() {
      if (
        !isCurrentContext() ||
        !canAcceptScan() ||
        localShelfConnected ||
        polling
      ) {
        return
      }
      polling = true
      try {
        const status = await getSmartShelvesStatus(storeId, activeToken)
        if (!isCurrentContext() || !canAcceptScan() || localShelfConnected) {
          return
        }
        pollFailureLogged = false
        const scan = status ? scanFromShelfStatus(status) : null
        if (!scan || scan.eventId === latestPolledEventId) {
          return
        }
        latestPolledEventId = scan.eventId
        const scannedAt = Date.parse(scan.latestScannedAt ?? "")
        // Polling returns the last scan, including scans made on another page.
        // Only a dated, fresh scan made after this editor was enabled is input.
        if (
          !Number.isFinite(scannedAt) ||
          enabledAt.current === null ||
          scannedAt < enabledAt.current ||
          scannedAt > Date.now() + MAX_POLLED_SCAN_AGE_MS ||
          Date.now() - scannedAt > MAX_POLLED_SCAN_AGE_MS
        ) {
          return
        }
        receiveScan(scan, "opm")
      } catch (error) {
        if (isCurrentContext() && !pollFailureLogged) {
          pollFailureLogged = true
          logger.debug("Scanner status is unavailable for layout search.", {
            error,
            storeId,
          })
        }
      } finally {
        polling = false
      }
    }

    // Subscribe for the editor's whole lifetime. Installing a subscription only
    // after a face is selected can lose a scan made immediately after that tap.
    // Current selection eligibility is checked at delivery instead.
    const unsubscribeConnection = localShelf.subscribeConnectionState(
      (connected) => {
        localShelfConnected = connected
      }
    )
    const unsubscribe = localShelf.subscribeSkuScanned((scan) => {
      receiveScan(scan, "local")
    })
    void pollScannerStatus()
    const pollInterval = window.setInterval(() => {
      void pollScannerStatus()
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      unsubscribe()
      unsubscribeConnection()
      window.clearInterval(pollInterval)
    }
  }, [isEditing, storeId, token])
}
