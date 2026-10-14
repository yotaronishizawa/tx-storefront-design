import { z } from "zod"

import { StoreName } from "../__generated__/opm-rpc"
import { count, flag, list, maybe, rawEnum, text } from "../../shared/fields"

/** A drink is aged once `now - addedAt` reaches `thresholdDays`; the app works it out. */
const stockExpiryWarningSchema = z.looseObject({
  enabled: flag,
  thresholdDays: count,
})

export type StockExpiryWarning = z.output<typeof stockExpiryWarningSchema>

// OPM defaults `shelfClientEnabled` to true, so a value it did not send reads as true.
const smartShelvesSchema = z.looseObject({
  shelfClientEnabled: z.boolean().catch(true),
})

const storeSchema = z.looseObject({
  id: z.string(),
  config: maybe(
    z.looseObject({
      smartShelves: maybe(smartShelvesSchema),
      smartStockShelvesEnabled: flag,
      stockExpiryWarning: maybe(stockExpiryWarningSchema),
    })
  ),
  robotId: text,
  storeName: text,
  storeNameEn: text,
  // Sent back to OPM as it came, to load the store's SKUs.
  storeType: rawEnum(StoreName),
})

export type Store = z.output<typeof storeSchema>

export function readStores(value: unknown): Store[] {
  return list(storeSchema, "stores").parse(value)
}
