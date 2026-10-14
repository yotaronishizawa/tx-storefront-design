/*
 * The shapes the stock shelf hub (`tx-stock-shelf`) pushes, which are not the
 * shapes OPM pushes.
 */
import { state } from "../state.mjs"
import { randomUUID } from "../utils/id.mjs"
import { nowIso } from "../utils/time.mjs"

// tx-stock-shelf writes OPM's own enum names (`reason.ToString()` in
// `StockShelfLaneEventPublisher.MapError`) where OPM sends the numbers.
const DISCREPANCY_CAUSE_NAMES = [
  "PlacedWithoutScanning",
  "RemovedWithoutScanning",
  "RemovedSkuFromOtherSession",
  "RestockingDiscrepancy",
  "RobotOperationDiscrepancy",
]

const INVALID_SKU_REASON_NAMES = {
  1: "IncompatibleWidth",
  2: "IncompatibleHeight",
}

export function toLocalLaneUpdate(location, laneEventType) {
  return {
    errorsInfo: (location.errors ?? []).map((error) => {
      const cause = DISCREPANCY_CAUSE_NAMES[error.cause] ?? ""
      return {
        discrepancyCause: error.invalidSkuId ? "" : cause,
        laneErrorType: error.invalidSkuId
          ? "DrinkConstraint"
          : "DrinkDiscrepancy",
        reasons: error.invalidSkuId
          ? (error.reasons ?? [])
              .map((reason) => INVALID_SKU_REASON_NAMES[reason])
              .filter(Boolean)
          : [cause].filter(Boolean),
        skuErrors: error.invalidSkuId ? [error.invalidSkuId] : [],
      }
    }),
    hardwareCellIndex: location.hardwareCellIndex ?? -1,
    laneEventType,
    locationId: location.id,
    skuIds: location.skuIds ?? [],
  }
}

/*
 * The hub's `laneEventType`, read off the change the way the app reads OPM's.
 * Always sending `Add` made an error or a clear look like an unscanned drink.
 * Never `SnapShot`, which the real hub sends only from `GetLaneSnapshot`; a
 * clear is `Fix`.
 */
export function toLocalLaneEventType({ errors = [], skuCountDiff = 0 }) {
  if (skuCountDiff > 0) {
    return "Add"
  }
  if (skuCountDiff < 0) {
    return "Remove"
  }
  return errors.length > 0 ? "Error" : "Fix"
}

/**
 * The hub's own check of a scanned code (`ScannerSkuResolver.Evaluate`): a bad
 * check digit, a code the catalogue lacks, a drink on no display location, or
 * a barcode shared by several displayed products. Any issue fails validation.
 */
export function evaluateLocalScan(code) {
  const issues = []
  if (!isValidJanCode(code)) {
    issues.push("InvalidJanCode")
  }
  const matches = state.skus.filter((item) => item.eanCode === code)
  const displayed = matches.filter((sku) =>
    state.displayLocations.some((location) => location.skuId === sku.id)
  )
  if (displayed.length === 0) {
    issues.push("ProductNotInDisplayShelf")
  } else if (displayed.length > 1) {
    issues.push("MultipleProductsInDisplayShelf")
  }
  if (matches.length === 0) {
    issues.push("ProductNotFound")
  }
  return issues
}

/** OPM's `SkuValidator.IsValidJanCode`: 8, 12 or 13 digits with a GS1 check digit. */
function isValidJanCode(code) {
  if (
    !/^\d+$/.test(code) ||
    /^0+$/.test(code) ||
    ![8, 12, 13].includes(code.length)
  ) {
    return false
  }
  const digits = (code.length === 12 ? `0${code}` : code).split("").map(Number)
  const check = digits.pop()
  const sum = digits
    .reverse()
    .reduce(
      (total, digit, index) => total + digit * (index % 2 === 0 ? 3 : 1),
      0
    )
  return (10 - (sum % 10)) % 10 === check
}

/**
 * `skuScanned` / `scannerScanProcessed` for a scanned JAN code. `outcome` is
 * what the scanner decided: `isAccepted`, `validationPassed`,
 * `validationIssues`, `restockingError` and `restockingSkuApplied`. As the
 * real hub, `sku` is only sent once validation passed, and `candidateSkuId`
 * is the raw code when no SKU matched.
 */
export function toLocalScan(code, outcome) {
  const sku = state.skus.find((item) => item.eanCode === code)
  return {
    candidateSkuId: sku?.id ?? code,
    code,
    eventId: `local-scan:${randomUUID()}`,
    // The shelf PC's own reading time, which it also reports to OPM.
    scannedAt: nowIso(),
    resolvedSkuId: sku?.id ?? "",
    sku:
      sku && outcome.validationPassed
        ? { itemName: sku.itemName, janCode: sku.eanCode, skuId: sku.id }
        : null,
    storeId: state.robot.storeId,
    ...outcome,
  }
}
