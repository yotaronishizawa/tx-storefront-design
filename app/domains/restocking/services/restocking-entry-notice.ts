import { readShelfState, selectMisplacedStock } from "~/domains/shelf"
import { readStoreSelectionState } from "~/domains/store-selection"

import { readRestockingState } from "../restocking-store"

/** Called only after the layout flow's leftover-stock notice was acknowledged. */
export function acknowledgeMisplacedStockForNextEntry() {
  readRestockingState().setAcknowledgedEntryMisplacementKey(misplacementKey())
}

/** New stock/lanes or a different store require their own notice. Never persisted. */
export function consumeMisplacedStockAcknowledgement(): boolean {
  const state = readRestockingState()
  const acknowledged = state.acknowledgedEntryMisplacementKey
  state.setAcknowledgedEntryMisplacementKey("")
  return Boolean(acknowledged) && acknowledged === misplacementKey()
}

function misplacementKey(): string {
  const { skuIds, laneIds } = selectMisplacedStock(readShelfState())
  if (skuIds.size === 0) return ""
  return JSON.stringify([
    readStoreSelectionState().selectedStoreId,
    [...skuIds].sort(),
    [...laneIds].sort(),
  ])
}
