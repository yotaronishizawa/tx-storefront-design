/*
 * The stock shelf hub at `/stockshelf`. It is a different product
 * (`tx-stock-shelf`): no token, no `Call` wrapper, and its own event names. It
 * rides on this server only so there is one process to run.
 */
import { toLocalLaneUpdate } from "../model/shelf-hub.mjs"
import { HubException } from "../rpc/define.mjs"
import { closeHubClients } from "../signalr/clients.mjs"
import { state } from "../state.mjs"

const HUB_METHODS = {
  // The last scan the hub processed, kept in its memory (`StockShelfHub.cs`).
  GetLatestScan: () => state.latestLocalScan,
  // tx-stock-shelf's `MapSnapshotLane` sends no errors: it has none to send,
  // so every lane arrives with an empty `errorsInfo`, as here.
  GetLaneSnapshot: () =>
    state.stockLocations.map((location) => ({
      ...toLocalLaneUpdate(location, "SnapShot"),
      errorsInfo: [],
    })),
}

export async function invokeShelfHub(_client, target, args) {
  const method = HUB_METHODS[target]
  if (!method) {
    throw new HubException(
      `Stock shelf simulator method ${target} is not implemented.`
    )
  }
  return method(args)
}

/** Drops every `/stockshelf` connection, so the app falls back to OPM polling. */
export function closeShelfHubClients() {
  closeHubClients("shelf")
}
