import { call } from "~/api/opm"
import {
  decodeOpmError,
  readSetCurrentRestockingSkuResponse,
  type AuthSession,
  type SetCurrentRestockingSkuErrorsName,
  type Sku,
  type SkuRecommendationCounts,
} from "~/api/opm/schemas"
import { showScannedDrinkToast } from "~/components/product/scanned-drink-toast"
import { createLogger } from "~/config/logger"
import { isRestockStudy } from "~/config/restock-study"
import { Toast } from "~/core"
import { readOperationsState, selectRestockRequest } from "~/domains/operations"
import { readSessionState } from "~/domains/session"
import { readStoreSelectionState } from "~/domains/store-selection"
import { readLanguage, translate } from "~/initializer/i18n"
import {
  getHubScanVerdict,
  getScanJanCode,
  getScanScannedAt,
  getScanSkuId,
  isHubMisread,
  type ScannerScan,
} from "~/model/scanner-scan"
import type { MisplacementCheck, ShelfLocation } from "~/model/shelf"
import {
  getLocalizedSkuName,
  getSkuJanCode,
  isValidJanCode,
  normalizeJanCode,
} from "~/model/sku"
import { AudioCues } from "~/utils/audio"

import {
  readRestockingState,
  type AppliedSkuScan,
  type ScanAlert,
} from "../restocking-store"
import { announceGuideOnScan } from "./restock-guide-voice"
import { playRestockingRecommendationCountAudio } from "./restocking-audio"
import { isRestockingScanContextActive } from "./restocking-event-context"

const logger = createLogger("Restocking Scan")

const SET_RESTOCKING_SKU_TIMEOUT_MS = 3000

/** A code, not a sentence: it is shown beside OPM's error names in `restockingSkuApplyFailed`. */
const UNREADABLE_RESPONSE_ERROR = "UnreadableResponse"

const SET_RESTOCKING_SKU_ERROR_AUDIO: Record<string, string> = {
  NoRestockTask: AudioCues.ScanErrorNoRestockTask,
  ServerError: AudioCues.ScanErrorServer,
  ShelfClientTimeout: AudioCues.ScanErrorShelfClientTimeout,
  ShelvesError: AudioCues.ScanErrorShelves,
  SkuDoesNotExist: AudioCues.NoRegisterDB,
  StockHasErrors: AudioCues.ScanErrorStockHasErrors,
  WeightStabilizationTimeout: AudioCues.ScanErrorWeightStabilizationTimeout,
} satisfies Partial<Record<SetCurrentRestockingSkuErrorsName, string>>

type ResolvedScanSku = { label: string; sku?: Sku; skuId: string }

type RestockingScanContext = {
  isMisplaced: MisplacementCheck
  onAlert: (alert: ScanAlert) => void
  onAudio: (key: string) => Promise<boolean>
  recommendations: SkuRecommendationCounts
  skus: Sku[]
  stockLocations: ShelfLocation[]
}

/** Resolves whether the drink was applied. */
export async function processRestockingScan({
  isMisplaced,
  onAlert,
  onAudio,
  onSkuApplied,
  onSkuNotFound,
  processingRef,
  recommendations,
  scan,
  scanKey,
  session,
  skus,
  stockLocations,
  storeId,
}: RestockingScanContext & {
  onSkuApplied: (scan: AppliedSkuScan) => void
  /** A code that matches no SKU replaces the last drink; a refused scan keeps it. */
  onSkuNotFound: () => void
  processingRef: { current: string }
  scan: ScannerScan
  /** The scan's most specific dedupe key; a scan with none is dropped. */
  scanKey: string
  session: AuthSession
  storeId: string
}): Promise<boolean> {
  // One scan at a time across both channels: the ref is held through the
  // await, so a second scan mid-flight is dropped rather than racing.
  if (!scanKey) {
    return false
  }
  if (processingRef.current) {
    logger.debug("Scan dropped: another is still being applied.", {
      code: getScanJanCode(scan),
      processing: processingRef.current,
    })
    return false
  }
  processingRef.current = scanKey
  const generation = readRestockingState().scanGeneration
  const requestId = selectRestockRequest(readOperationsState())?.requestId
  const current = () =>
    generation === readRestockingState().scanGeneration &&
    isRestockingScanContextActive() &&
    requestId === selectRestockRequest(readOperationsState())?.requestId &&
    readSessionState().session?.token === session.token &&
    readStoreSelectionState().selectedStoreId === storeId

  try {
    const scannedSku = resolveRestockingScanSku(scan, skus)
    const code = getScanJanCode(scan)
    const toastId = getRestockingScanToastId(scan)
    const showToast = (type: "error" | "info" | "success", message: string) =>
      showScannedDrinkToast({
        code,
        id: toastId,
        message,
        sku: scannedSku.sku,
        type,
      })

    // The last drink stays on a refusal, whether OPM answered us or the hub.
    const refuse = (error: string) => {
      const { audio, code: supportCode, name } = describeRestockingError(error)
      void onAudio(audio)
      onAlert({ code: supportCode, error: name, kind: "refused" })
      showToast(
        "error",
        translate("restockingSkuApplyFailed", {
          error: supportCode,
          sku: scannedSku.label,
        })
      )
    }

    showToast("info", scannedDrinkMessage(scannedSku, code))

    const hubVerdict = getHubScanVerdict(scan)
    if (hubVerdict === "refused") {
      refuse(scan.restockingError)
      return false
    }

    if (!scannedSku.skuId) {
      onSkuNotFound()
      // A malformed code is a misread to scan again, not an unregistered drink.
      const misread =
        isHubMisread(scan) || !isValidJanCode(normalizeJanCode(code))
      void onAudio(misread ? AudioCues.FailedScan : AudioCues.NoRegisterDB)
      onAlert(
        misread ? { kind: "invalid-scan" } : { code, kind: "not-in-system" }
      )
      showToast(
        "error",
        translate("restockingScanSkuNotFound", { code: code || "-" })
      )
      return false
    }

    // The hub already set it on OPM; asking again would re-apply it on the
    // shelf and could race a newer scan. Its answer has no lanes to colour.
    const response =
      hubVerdict === "applied"
        ? { error: "", incompatibleLanes: undefined }
        : await setCurrentRestockingSku(
            storeId,
            scannedSku.skuId,
            session.token
          )

    if (!current()) {
      Toast.notify.dismiss(toastId)
      return false
    }
    // An unreadable answer is a refusal: treating it as success could send
    // the operator to a lane OPM rejected.
    if (!response || response.error) {
      refuse(response?.error || UNREADABLE_RESPONSE_ERROR)
      return false
    }

    onSkuApplied({
      code: normalizeJanCode(code),
      compatibilityKnown: response.incompatibleLanes !== undefined,
      incompatibleLaneIds: response.incompatibleLanes ?? [],
      scannedAt: getScanScannedAt(scan),
      skuId: scannedSku.skuId,
    })
    announceAppliedSku(code, scannedSku.skuId, {
      isMisplaced,
      onAlert,
      onAudio,
      recommendations,
      skus,
      stockLocations,
    })
    showToast(
      "success",
      translate("restockingSkuApplied", { sku: scannedSku.label })
    )
    return true
  } catch (caught) {
    if (!current()) return false
    logger.warn("Applying the scan failed in transport.", caught)
    void onAudio(AudioCues.ScanErrorDisconnected)
    onAlert({ kind: "disconnected" })
    return false
  } finally {
    if (processingRef.current === scanKey) {
      processingRef.current = ""
    }
  }
}

/** The "you scanned this" toast, before OPM has answered. */
export function showRestockingScanReceivedToast(
  scan: ScannerScan,
  skus: Sku[]
) {
  const scannedSku = resolveRestockingScanSku(scan, skus)
  const code = getScanJanCode(scan)
  showScannedDrinkToast({
    code,
    id: getRestockingScanToastId(scan),
    message: scannedDrinkMessage(scannedSku, code),
    sku: scannedSku.sku,
    type: "info",
  })
}

function scannedDrinkMessage(scannedSku: ResolvedScanSku, code: string) {
  return translate("restockingSkuScanned", {
    sku: scannedSku.label || code || "-",
  })
}

/** A timed-out command is not replayed: it can still reach OPM after a route change. */
async function setCurrentRestockingSku(
  storeId: string,
  skuId: string,
  token: string
) {
  return readSetCurrentRestockingSkuResponse(
    await withTimeout(
      call("SetCurrentRestockingSku", [{ storeId, skuId }], token),
      SET_RESTOCKING_SKU_TIMEOUT_MS
    )
  )
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = globalThis.setTimeout(
      () => reject(new Error(`Timed out after ${ms} ms`)),
      ms
    )
    promise.then(resolve, reject).finally(() => globalThis.clearTimeout(timer))
  })
}

/**
 * The cue for a refused scan (anything outside the enum is a failed scan), the
 * enum name that picks its message, and its support code or the raw error.
 */
function describeRestockingError(responseError: string): {
  audio: string
  code: string
  name: string
} {
  const decoded = decodeOpmError(responseError, "SetCurrentRestockingSkuErrors")
  return {
    audio:
      (decoded?.name && SET_RESTOCKING_SKU_ERROR_AUDIO[decoded.name]) ??
      AudioCues.FailedScan,
    code: decoded?.code ?? responseError,
    name: decoded?.name ?? "",
  }
}

/** The alert or cue for an applied drink: several products on one JAN, then not on display, then the count. */
function announceAppliedSku(
  code: string,
  skuId: string,
  {
    isMisplaced,
    onAlert,
    onAudio,
    recommendations,
    skus,
    stockLocations,
  }: RestockingScanContext
) {
  // Checked before "not on display": the operator must first pick which product it is.
  if (countDisplaySkusForJan(code, skus, isMisplaced) > 1) {
    void onAudio(AudioCues.ScanMultipleSkuSameJanCode)
    onAlert({ code, kind: "same-jan" })
    return
  }
  if (isMisplaced(skuId)) {
    void onAudio(AudioCues.NoRegisterDS)
    onAlert({ kind: "not-on-display", skuId })
    return
  }
  // The study says the drink and where it goes instead of a count.
  if (isRestockStudy()) {
    announceGuideOnScan(skuId)
    return
  }
  void playRestockingRecommendationCountAudio({
    onAudio,
    phase: "scan",
    recommendations,
    skuId,
    stockLocations,
  })
}

function resolveRestockingScanSku(
  scan: ScannerScan,
  skus: Sku[]
): ResolvedScanSku {
  const directSkuId = getScanSkuId(scan)
  const janCode = getScanJanCode(scan)
  const sku =
    (directSkuId ? skus.find((item) => item.id === directSkuId) : undefined) ??
    skus.find((item) => getSkuJanCode(item) === normalizeJanCode(janCode))
  // Only a catalogue drink: the hub's `candidateSkuId` is the raw code when
  // nothing matched, and OPM would answer `SkuDoesNotExist` for it.
  if (!sku) {
    return { label: janCode, skuId: "" }
  }
  return {
    label: getLocalizedSkuName(sku, readLanguage()) || sku.id,
    sku,
    skuId: sku.id,
  }
}

function countDisplaySkusForJan(
  janCode: string,
  skus: Sku[],
  isMisplaced: MisplacementCheck
): number {
  const code = normalizeJanCode(janCode)
  if (!code) {
    return 0
  }
  return skus.filter(
    (sku) => getSkuJanCode(sku) === code && !isMisplaced(sku.id)
  ).length
}

function getRestockingScanToastId(scan: ScannerScan): string {
  const scanId =
    scan.eventId || getScanJanCode(scan) || getScanSkuId(scan) || "unknown"
  return `restocking-scan:${scanId}`
}
