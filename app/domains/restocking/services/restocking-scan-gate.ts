import { createLogger } from "~/config/logger"
import { ROUTES } from "~/config/routes"
import { readOperationsState, selectRestockRequest } from "~/domains/operations"
import { readSessionState } from "~/domains/session"
import {
  readShelfState,
  selectLaneErrorBlock,
  selectMisplacementCheck,
} from "~/domains/shelf"
import {
  getScanJanCode,
  getScanSkuId,
  type ScannerScan,
} from "~/model/scanner-scan"
import { blocksScan } from "~/model/shelf"
import { normalizeJanCode } from "~/model/sku"
import { AudioCues, playStoreAudio } from "~/utils/audio"
import { isSamePathname } from "~/utils/pathname"

import { readRestockingState } from "../restocking-store"
import {
  canApplyRestockingScan,
  isRestockingActive,
} from "./restocking-event-context"
import {
  processRestockingScan,
  showRestockingScanReceivedToast,
} from "./restocking-scan"

const logger = createLogger("Restocking OPM")

const SCAN_DEDUPE_TTL_MS = 30_000
/** Code and SKU keys expire sooner, so the same drink can be scanned again. */
const SCAN_CODE_DEDUPE_TTL_MS = 2_500

/** A polled scan this much older than the subscription is OPM's cached last scan. */
const POLLED_SCAN_MAX_AGE_MS = 5000

type RestockingScanGateOptions = {
  storeId: string
  /** Outlives the subscription, so a resubscribe never replays a scan in flight. */
  processingRef: { current: string }
  /** Outlives the subscription, so a resubscribe never replays a scan already handled. */
  processedScans: Map<string, number>
}

/**
 * Takes a scan from either channel and processes it when restocking is active
 * and started, the scan is for this store, it was not already seen on the
 * other channel, and no lane error blocks it.
 */
export function createRestockingScanGate({
  storeId,
  processingRef,
  processedScans,
}: RestockingScanGateOptions) {
  return function handleRestockingScan(scan: ScannerScan, source: string) {
    const log = (message: string, details?: object) =>
      logger.debug(message, { code: scan.code, source, storeId, ...details })

    log("scanner scan received", {
      scan,
      pathname: readRestockingState().currentPathname,
    })

    // Consume editor scans so a cached OPM event cannot apply after navigation.
    if (
      isSamePathname(
        readRestockingState().currentPathname,
        ROUTES.edit().pathname
      )
    ) {
      if (!scan.storeId || scan.storeId === storeId)
        recordScanKeys(getScanDedupeKeys(scan), processedScans)
      return
    }
    if (!isRestockingActive()) {
      log("scanner scan ignored: inactive context")
      return
    }

    if (!canApplyRestockingScan()) {
      log("scanner scan ignored: no restock started or resumed")
      return
    }

    if (scan.storeId && scan.storeId !== storeId) {
      log("scanner scan ignored: store mismatch", { scanStoreId: scan.storeId })
      return
    }

    const request = selectRestockRequest(readOperationsState())
    if (
      scan.restockingSessionId &&
      scan.restockingSessionId.toLowerCase() !==
        request?.requestId.toLowerCase()
    ) {
      log("scanner scan ignored: restocking request mismatch", {
        requestId: scan.restockingSessionId,
      })
      return
    }
    const session = readSessionState().session
    if (!session) {
      log("scanner scan ignored: no session")
      return
    }

    const scanKeys = getScanDedupeKeys(scan)
    const duplicateKey = recordScanKeys(scanKeys, processedScans)
    if (duplicateKey) {
      log("scanner scan ignored: duplicate", { scanKey: duplicateKey })
      return
    }

    const shelf = readShelfState()
    if (blocksScan(selectLaneErrorBlock(shelf))) {
      log("scanner scan refused: a lane has an error")
      void playStoreAudio(AudioCues.ScanErrorStockHasErrors)
      readRestockingState().pushScanAlert({ kind: "lane-errors" })
      forgetScanCodeKeys(scanKeys, processedScans)
      return
    }

    log("processing scanner scan", { eventId: scan.eventId })
    void processRestockingScan({
      isMisplaced: selectMisplacementCheck(shelf),
      onAlert: (alert) => readRestockingState().pushScanAlert(alert),
      onAudio: playStoreAudio,
      onSkuApplied: (applied) => readRestockingState().applyScan(applied),
      onSkuNotFound: () => readRestockingState().clearScan(),
      processingRef,
      recommendations: shelf.recommendationCounts,
      scan,
      scanKey: scanKeys[0] ?? "",
      session,
      skus: shelf.skus,
      stockLocations: shelf.stockLocations,
      storeId,
    }).then((applied) => {
      if (!applied) {
        forgetScanCodeKeys(scanKeys, processedScans)
      }
    })
  }
}

/**
 * Tells the operator what the local hub read, before it is processed, when the
 * scan would be taken; not while another is being applied, since that one drops it.
 */
export function toastLocalShelfScan(
  scan: ScannerScan,
  storeId: string,
  processingRef: { current: string }
) {
  const otherStore = Boolean(scan.storeId) && scan.storeId !== storeId
  const wouldTake =
    !processingRef.current &&
    isRestockingActive() &&
    canApplyRestockingScan() &&
    !otherStore &&
    !blocksScan(selectLaneErrorBlock(readShelfState()))
  if (wouldTake) {
    showRestockingScanReceivedToast(scan, readShelfState().skus)
  }
}

/**
 * OPM reads and pushed statuses carry the cached last scan. Share this filter
 * across both sources: a late read must not overwrite a newer pushed scan,
 * and repeating a cached status must not replay it after the gate TTL expires.
 */
export function createPolledScanFilter(storeId: string, subscribedAt: number) {
  let lastEventId = ""
  let latestAcceptedTimestamp = Number.NEGATIVE_INFINITY
  const eventsAtLatestTimestamp = new Set<string>()

  return function shouldProcessPolledScannerScan(scan: ScannerScan): boolean {
    const { eventId, latestScannedAt } = scan
    if (!eventId || eventId === lastEventId) {
      return false
    }

    lastEventId = eventId
    const scannedAt = Date.parse(latestScannedAt ?? "")
    const stale =
      Number.isFinite(scannedAt) &&
      scannedAt < subscribedAt - POLLED_SCAN_MAX_AGE_MS
    if (stale) {
      logger.debug("poll scan ignored: stale cached scan", {
        latestScannedAt,
        storeId,
        subscribedAt: new Date(subscribedAt).toISOString(),
      })
      return false
    }

    if (Number.isFinite(scannedAt)) {
      if (scannedAt < latestAcceptedTimestamp) return false
      if (scannedAt > latestAcceptedTimestamp) {
        latestAcceptedTimestamp = scannedAt
        eventsAtLatestTimestamp.clear()
      }
      // Distinct physical events may share a timestamp at the producer's precision.
      if (eventsAtLatestTimestamp.has(eventId)) return false
      eventsAtLatestTimestamp.add(eventId)
    }
    return true
  }
}

/**
 * Records the scan's keys, or returns the key already seen: the hub and OPM can
 * both report one physical scan.
 */
function recordScanKeys(
  scanKeys: string[],
  processedScans: Map<string, number>
): string | undefined {
  pruneScanDedupeCache(processedScans)
  const duplicateKey = scanKeys.find((key) => processedScans.has(key))
  if (duplicateKey) {
    return duplicateKey
  }
  const now = Date.now()
  for (const key of scanKeys) {
    processedScans.set(key, now)
  }
  return undefined
}

/** Lets a refused drink be scanned again at once; event and status keys stay. */
function forgetScanCodeKeys(
  scanKeys: string[],
  processedScans: Map<string, number>
) {
  for (const key of scanKeys) {
    if (isCodeOrSkuKey(key)) {
      processedScans.delete(key)
    }
  }
}

function isCodeOrSkuKey(key: string): boolean {
  return key.startsWith("code:") || key.startsWith("sku:")
}

/** Every key the same physical scan may arrive under, most specific first. */
function getScanDedupeKeys(scan: ScannerScan): string[] {
  const keys: string[] = []
  const { eventId, latestScannedAt } = scan
  const rawCode = getScanJanCode(scan)
  const code = normalizeJanCode(rawCode)
  const skuId = getScanSkuId(scan)

  if (eventId) {
    keys.push(`event:${eventId}`)
  }
  if (latestScannedAt && rawCode) {
    keys.push(`status:${latestScannedAt}:${code}`)
  }
  if (latestScannedAt) {
    keys.push(`status:${latestScannedAt}`)
  }
  if (rawCode) {
    keys.push(`code:${code}`)
  }
  if (skuId) {
    keys.push(`sku:${skuId}`)
  }
  return [...new Set(keys)]
}

function pruneScanDedupeCache(cache: Map<string, number>) {
  const now = Date.now()
  for (const [key, seenAt] of cache) {
    const ttl = isCodeOrSkuKey(key)
      ? SCAN_CODE_DEDUPE_TTL_MS
      : SCAN_DEDUPE_TTL_MS
    if (now - seenAt > ttl) {
      cache.delete(key)
    }
  }
}
