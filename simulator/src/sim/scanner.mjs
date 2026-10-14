/** The barcode scanner, the smart shelf and the local stock shelf hub. */
import { publishShelfHub, publishSmartShelvesStatus } from "../events.mjs"
import { closeShelfHubClients } from "../hubs/shelf.mjs"
import { evaluateLocalScan, toLocalScan } from "../model/shelf-hub.mjs"
import { state } from "../state.mjs"
import { dateTimeOffsetNow } from "../utils/time.mjs"
import { post } from "./route.mjs"

export const scannerRoutes = [
  post("/sim/scanner/scan", (params) => {
    const code = params.get("code") ?? state.skus[0].eanCode
    state.latestScan = {
      latestScannedJanEanCode: code,
      latestScannedAt: dateTimeOffsetNow(),
    }
    // The hub's own check decides unless `validated` overrides it.
    const validationIssues =
      params.get("validated") === "true" ? [] : evaluateLocalScan(code)
    const validationPassed =
      params.get("validated") !== "false" && validationIssues.length === 0
    const restockingError = params.get("restockingError") ?? ""
    const isAccepted =
      params.get("accepted") !== "false" && validationPassed && !restockingError
    const sku = state.skus.find((item) => item.eanCode === code)
    // tx-stock-shelf sets the SKU on the active restock itself
    // (`ScannerRestockingSkuService`), paused or not, as OPM counts it active.
    const restockingSessionId = state.currentRestockingId || null
    const applied =
      params.get("applied") === null
        ? Boolean(restockingSessionId && sku && isAccepted)
        : params.get("applied") === "true"
    if (applied && sku) {
      state.currentRestockingSku = sku.id
    }
    const localScan = toLocalScan(code, {
      isAccepted,
      validationPassed,
      validationIssues,
      restockingError,
      restockingSessionId,
      restockingSkuApplied: applied,
      scannedAt: state.latestScan.latestScannedAt,
    })
    state.latestLocalScan = localScan
    publishShelfHub("skuScanned", localScan)
    publishShelfHub("scannerScanProcessed", localScan)
    publishSmartShelvesStatus()
    return { ok: true, scan: state.latestScan }
  }),
  post("/sim/shelf/connection", (params) => {
    const shelf = params.get("connected")
    const scanner = params.get("scanner")
    if (shelf !== null) {
      state.shelfConnected = shelf !== "false"
    }
    if (scanner !== null) {
      // `scanner=absent` drops the scannerStatus block entirely, which is what
      // OPM relays while the scanner is unplugged (tx-stock-shelf sends none).
      state.scannerPresent = scanner !== "absent"
      state.scannerConnected = state.scannerPresent && scanner !== "false"
    }
    publishSmartShelvesStatus()
    return {
      ok: true,
      shelfConnected: state.shelfConnected,
      scannerPresent: state.scannerPresent,
      scannerConnected: state.scannerConnected,
    }
  }),
  post("/sim/shelf-hub/connection", (params) => {
    state.shelfHubUp = params.get("up") !== "false"
    if (!state.shelfHubUp) {
      closeShelfHubClients()
    }
    return { ok: true, shelfHubUp: state.shelfHubUp }
  }),
]
