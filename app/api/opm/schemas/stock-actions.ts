import { z } from "zod"

import { enumValue, flag, parse } from "../../shared/fields"
import { readOpmLocationErrors } from "./lane-update"

/** One drink to take out of a stock lane: which SKU, at which position. */
export type StockDrinkRemoval = { skuId: string; skuIndex: number }

/** `RemoveSkusFromStockResult` is a bare enum, wrapped as `{ error }` for the action runner; unreadable reads as `ServerError`. */
export function readRemoveSkusFromStockResult(value: unknown): {
  error: number | string
} {
  if (typeof value === "number" || typeof value === "string") {
    return { error: value }
  }
  return { error: "ServerError" }
}

const forceDiscrepancyResolutionResponseSchema = z.looseObject({
  error: enumValue,
  isLaneDisabled: flag,
  // What OPM says is still wrong with the lane after the check.
  laneErrors: z.unknown().transform(readOpmLocationErrors),
})

export type ForceDiscrepancyResolutionResponse = z.output<
  typeof forceDiscrepancyResolutionResponseSchema
>

/** An unreadable answer is a `ServerError`, so the lane is never marked as checked by mistake. */
export function readForceDiscrepancyResolutionResponse(
  value: unknown
): ForceDiscrepancyResolutionResponse {
  return (
    parse(
      forceDiscrepancyResolutionResponseSchema,
      value,
      "force discrepancy resolution"
    ) ?? { error: "ServerError", isLaneDisabled: false, laneErrors: [] }
  )
}
