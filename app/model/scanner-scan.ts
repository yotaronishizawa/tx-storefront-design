import type { SmartShelvesStatus } from "~/api/opm/schemas"
import type { StockShelfScan } from "~/api/stock-shelf"

/**
 * A scan from the local shelf hub, or one rebuilt from OPM's scanner status
 * when the hub is not there. Only the rebuilt one has `latestScannedAt`, which
 * is what dedupes and ages polled scans.
 */
export type ScannerScan = StockShelfScan & { latestScannedAt?: string }

/** Which channel last delivered a scan: the local shelf hub, OPM polling, or neither yet. */
export type ScannerConnectionSource = "signalr" | "opm" | null

/** OPM's latest scan for the store, or `null` when it has none. */
export function scanFromShelfStatus(
  status: SmartShelvesStatus
): ScannerScan | null {
  const scanner = status.scannerStatus
  if (!scanner?.latestScannedJanEanCode || !scanner.latestScannedAt) {
    return null
  }

  return {
    eventId: `scanner-status:${scanner.latestScannedAt}`,
    code: scanner.latestScannedJanEanCode,
    candidateSkuId: "",
    resolvedSkuId: "",
    restockingError: "",
    restockingSessionId: "",
    storeId: status.storeId,
    validationIssues: [],
    latestScannedAt: scanner.latestScannedAt,
    scannedAt: scanner.latestScannedAt,
  }
}

/**
 * When the barcode was read, by the shelf PC's clock on either channel: OPM
 * relays the time tx-stock-shelf reported, so a scan seen on both matches.
 */
export function getScanScannedAt(scan: ScannerScan): string | undefined {
  return scan.latestScannedAt || scan.scannedAt || undefined
}

/**
 * The scan that last reset the "+N added" counts, timed by the shelf PC's
 * clock (`getScanScannedAt`), or the tablet's for a scan that carries none.
 */
export type AppliedScan = { code: string; scannedAt: string }

/**
 * Whether a polled scan is `applied` seen again: same code, scanned no later
 * than it. Both times come from the same clock, so tablet skew never turns a
 * rescan into a replay.
 *
 * @example isAppliedScanReplay({ code: "4900000000010", scannedAt: "2026-10-02T04:44:45.572+00:00" }, "4900000000010", "2026-10-02T04:44:45.572+00:00") // true
 */
export function isAppliedScanReplay(
  applied: AppliedScan | undefined,
  code: string,
  scannedAt: string | undefined
): boolean {
  if (!applied || !scannedAt || applied.code !== code) {
    return false
  }
  const scanned = Date.parse(scannedAt)
  const appliedScannedAt = Date.parse(applied.scannedAt)
  return (
    Number.isFinite(scanned) &&
    Number.isFinite(appliedScannedAt) &&
    scanned <= appliedScannedAt
  )
}

export function getScanJanCode(scan: ScannerScan): string {
  return scan.sku?.janCode || scan.code
}

export function getScanSkuId(scan: ScannerScan): string {
  return scan.sku?.skuId || scan.resolvedSkuId || scan.candidateSkuId
}

/**
 * What the local shelf hub already did with a scan. The hub checks the code
 * and, when it passes, sets the drink on OPM itself, so its answer carries
 * OPM's verdict too:
 * - `applied`: the hub set it; asking OPM again would apply it twice.
 * - `refused`: OPM refused it through the hub (`restockingError`).
 * - `opm`: the hub did not decide (a polled scan, no catalogue, no restock
 *   open, or a display-shelf-only refusal the operator may still restock past).
 *
 * @example getHubScanVerdict({ validationPassed: true, isAccepted: true, restockingSkuApplied: true, restockingError: "", validationIssues: [] } as ScannerScan) // "applied"
 */
export function getHubScanVerdict(
  scan: ScannerScan
): "applied" | "refused" | "opm" {
  if (scan.validationPassed === undefined) {
    return "opm"
  }
  if (scan.restockingError) {
    return "refused"
  }
  if (scan.isAccepted && scan.restockingSkuApplied) {
    return "applied"
  }
  return "opm"
}

/** The hub read the code as a malformed barcode. */
export function isHubMisread(scan: ScannerScan): boolean {
  return scan.validationIssues.includes("InvalidJanCode")
}
