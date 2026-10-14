import { z } from "zod"

import { list, maybe, parse, text } from "../shared/fields"
import {
  ScannerSkuValidationIssue,
  StockShelfLaneEventType,
} from "./__generated__/stock-shelf-hub"

/** `discrepancyCause` and `reasons` are OPM enum names that tx-stock-shelf relays as text. */
const laneErrorSchema = z.looseObject({
  laneErrorType: text,
  discrepancyCause: text,
  reasons: list(z.string()),
  skuErrors: list(z.string()),
})

const laneUpdateSchema = z.looseObject({
  locationId: z.string(),
  hardwareCellIndex: z.number().catch(-1),
  laneEventType: z.enum(StockShelfLaneEventType).catch("SnapShot"),
  skuIds: list(z.string()),
  errorsInfo: list(laneErrorSchema, "lane errors"),
})

export type StockShelfLaneUpdate = z.output<typeof laneUpdateSchema>

const scanSchema = z.looseObject({
  eventId: text,
  code: text,
  /** When the shelf PC read the barcode, by its own clock. */
  scannedAt: text,
  candidateSkuId: text,
  resolvedSkuId: text,
  sku: maybe(z.looseObject({ itemName: text, janCode: text, skuId: text })),
  isAccepted: maybe(z.boolean()),
  validationPassed: maybe(z.boolean()),
  /** Why the hub's own check failed; an unknown name is dropped. */
  validationIssues: list(
    z.enum(ScannerSkuValidationIssue),
    "validation issues"
  ),
  restockingSkuApplied: maybe(z.boolean()),
  restockingError: text,
  /** The restock the hub applied the SKU to, when it did. */
  restockingSessionId: text,
  storeId: text,
})

export type StockShelfScan = z.output<typeof scanSchema>

/** A `laneSkuChanged` event. */
export function readLaneUpdate(value: unknown): StockShelfLaneUpdate | null {
  return parse(laneUpdateSchema, value, "local lane update")
}

/** `GetLaneSnapshot`. */
export function readLaneUpdates(value: unknown): StockShelfLaneUpdate[] {
  return list(laneUpdateSchema, "local lane snapshot").parse(value)
}

/** A `skuScanned` or `scannerScanProcessed` event. */
export function readScan(value: unknown): StockShelfScan | null {
  return parse(scanSchema, value, "scanner scan")
}
