import { z } from "zod"

import { SmartShelfModes } from "../__generated__/opm-rpc"
import { enumName, flag, maybe, parse, text } from "../../shared/fields"
import { unwrapResponse } from "../errors"

const smartShelvesStatusSchema = z.looseObject({
  isConnected: flag,
  // What the shelves are tilted for, as tx-stock-shelf last reported it at `reportedAt`.
  mode: enumName(SmartShelfModes),
  // Null while the scanner is unplugged (tx-stock-shelf sends none) or the store has none.
  scannerStatus: maybe(
    z.looseObject({
      isConnected: flag,
      latestScannedAt: text,
      latestScannedJanEanCode: text,
    })
  ),
  // When the shelf client last reported, and what it runs: OPM refuses manual
  // replenishment for a stale report or an old client.
  reportedAt: text,
  shelfClientVersion: text,
  storeId: text,
})

export type SmartShelvesStatus = z.output<typeof smartShelvesStatusSchema>

/** `GetSmartShelvesStatus` wraps its answer in `{ data }`; the pushed event does not. */
export function readSmartShelvesStatus(
  value: unknown
): SmartShelvesStatus | null {
  return parse(
    smartShelvesStatusSchema,
    unwrapResponse(value),
    "smart shelves status"
  )
}
