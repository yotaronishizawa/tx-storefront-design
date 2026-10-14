import { z } from "zod"

import {
  ChangeErrors,
  DiscrepancyCause,
  InvalidSkuReason,
} from "../__generated__/opm-rpc"
import {
  count,
  enumName,
  enumNameOf,
  enumValue,
  list,
  parse,
  text,
} from "../../shared/fields"
import { skuEntrySchema } from "./shelf"

/** OPM's `InvalidSkuError` or `DiscrepancyError`, told apart by which fields it has. */
const locationErrorSchema = z.looseObject({
  // Only a `DiscrepancyError` has one.
  cause: enumName(DiscrepancyCause),
  // Only an `InvalidSkuError` has these.
  invalidSkuId: text,
  reasons: list(enumValue).transform((reasons) =>
    reasons.map((reason) => enumNameOf(InvalidSkuReason, reason))
  ),
})

export type OpmLocationError = z.output<typeof locationErrorSchema>

/*
 * `skuIds` is the lane's full contents after the event, for both Add and Remove.
 * `removedSkuIds` (Remove only) is deliberately not read: writing it over the
 * lane would blank every lane an Add touches. See `AddedOrRemovedSku` in
 * txoperationmanager `RpcGateway.StockSkusChangesSubscription.cs`.
 */
const stockSkuChangeSchema = z.looseObject({
  locationId: z.string(),
  changedSkuId: text,
  eventId: text,
  skuIds: list(z.string()),
  skuEntries: list(skuEntrySchema),
  errors: list(locationErrorSchema, "lane errors"),
  // Only a `StockSkuChangeError` has an `error`; only an added or removed SKU the diff.
  // `ChangeErrors` starts at `CurrentSkuNotSet` = 0 and ends at `None`, so read the name.
  error: enumName(ChangeErrors),
  skuCountDiff: count,
})

export type OpmStockSkuChange = z.output<typeof stockSkuChangeSchema>

const locationStateSchema = z.looseObject({
  locationId: z.string(),
  skuIds: list(z.string()),
  skuEntries: list(skuEntrySchema),
  errors: list(locationErrorSchema, "lane errors"),
})

export type OpmLocationState = z.output<typeof locationStateSchema>

/** OPM's `OnStockSkusChanged` event. */
export function readOpmStockSkuChanges(value: unknown): OpmStockSkuChange[] {
  const event = parse(
    z.looseObject({
      changes: list(stockSkuChangeSchema, "stock SKU changes"),
    }),
    value,
    "stock SKU changes"
  )
  return event?.changes ?? []
}

/** The snapshot in OPM's `SubscribeToStockSkuChanges` answer. */
export function readOpmRestockingSnapshot(value: unknown): OpmLocationState[] {
  const snapshot = parse(
    z.looseObject({
      allLocationsStates: list(locationStateSchema, "restocking snapshot"),
    }),
    value,
    "restocking snapshot"
  )
  return snapshot?.allLocationsStates ?? []
}

/** A shelf location's `errors`, as sent by OPM. */
export function readOpmLocationErrors(value: unknown): OpmLocationError[] {
  return list(locationErrorSchema, "location errors").parse(value)
}
