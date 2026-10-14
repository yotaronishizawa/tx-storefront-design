import { LOCAL_STOCK_SHELF_SIGNALR_URL } from "~/config/env"

import { HubClient } from "../shared/hub-client"
import type {
  StockShelfHubArgs,
  StockShelfHubEventName,
  StockShelfHubMethodName,
} from "./__generated__/stock-shelf-hub"
import {
  readLaneUpdate,
  readLaneUpdates,
  readScan,
  type StockShelfLaneUpdate,
  type StockShelfScan,
} from "./schemas"

type Listener<T> = (value: T) => void

/** No URL means this deployment has no local shelf hardware, so it never connects. */
const hub = new HubClient({
  scope: "Local Shelf SignalR",
  url: LOCAL_STOCK_SHELF_SIGNALR_URL,
})

/** The tx-stock-shelf hub beside the shelf: scans and lane changes, ahead of OPM's polling. */
export const localShelf = {
  start: () => hub.start(),
  stop: () => hub.stop(),

  subscribeConnectionState: (listener: Listener<boolean>) =>
    hub.onConnectionChange(listener),

  subscribeLaneUpdate: (listener: Listener<StockShelfLaneUpdate>) =>
    listen("laneSkuChanged", readLaneUpdate, listener),

  subscribeScannerScanProcessed: (listener: Listener<StockShelfScan>) =>
    listen("scannerScanProcessed", readScan, listener),

  subscribeSkuScanned: (listener: Listener<StockShelfScan>) =>
    listen("skuScanned", readScan, listener),

  /** The last scan the hub processed, which it applies to the open restock itself; `null` before any. */
  async getLatestScan(): Promise<StockShelfScan | null> {
    if (!hub.isConnected) {
      return null
    }
    return readScan(await invoke("GetLatestScan"))
  },

  async getLaneSnapshot(): Promise<StockShelfLaneUpdate[]> {
    if (!hub.isConnected) {
      return []
    }
    return readLaneUpdates(await invoke("GetLaneSnapshot"))
  },
}

function invoke<M extends StockShelfHubMethodName>(
  method: M,
  ...args: StockShelfHubArgs<M>
): Promise<unknown> {
  return hub.traced(method, args, () => hub.invoke(method, ...args))
}

/** Each `event` payload that `read` accepts goes to `listener`; returns the unsubscribe. */
function listen<T>(
  event: StockShelfHubEventName,
  read: (payload: unknown) => T | null,
  listener: Listener<T>
): () => void {
  return hub.on(event, (payload) => {
    hub.log("EVENT", event, payload)
    const value = read(payload)
    if (value) {
      listener(value)
    }
  })
}
