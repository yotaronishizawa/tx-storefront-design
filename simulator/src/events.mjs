/*
 * Everything the simulator pushes to connected apps, on either hub. Anything
 * that changes lane or shelf state calls one of these to announce it.
 *
 * The OPM pushes are what OPM should send once fixed: develop broadcasts lane
 * and shelf changes over MagicOnion only.
 */
import { findStockLocation } from "./model/lanes.mjs"
import { toLocalLaneEventType, toLocalLaneUpdate } from "./model/shelf-hub.mjs"
import { smartShelvesStatus } from "./model/smart-shelves.mjs"
import { clientsOf, sendInvocation } from "./signalr/clients.mjs"
import { state } from "./state.mjs"

const STOCK_SKU_TOPIC_PREFIX = "SubscribeToStockSkuChangesCommand_"
const SMART_SHELVES_TOPIC_PREFIX = "SubscribeToSmartShelvesStatus_"

export function publishShelfHub(target, payload) {
  for (const client of clientsOf("shelf")) {
    sendInvocation(client, target, payload)
  }
}

/**
 * Lane changes reach the stock shelf hub as `laneSkuChanged`, and OPM clients
 * the way they asked for them: wrapped in a topic broadcast once subscribed to
 * one, on the bare event until then. Each change is sent once per client.
 */
export function publishStockSkuChanges(changes) {
  for (const change of changes) {
    const location = findStockLocation(change.locationId)
    if (location) {
      publishShelfHub(
        "laneSkuChanged",
        toLocalLaneUpdate(location, toLocalLaneEventType(change))
      )
    }
  }

  const event = toStockSkusChangedEvent(changes)
  for (const client of clientsOf("opm")) {
    const topic = [...client.topics].find((name) =>
      name.startsWith(STOCK_SKU_TOPIC_PREFIX)
    )

    if (topic) {
      sendInvocation(client, "OnSignalRRpcBroadcast", {
        topic,
        kind: "stockSkusChanged",
        payload: event,
      })
    } else {
      sendInvocation(client, "OnStockSkusChanged", event)
    }
  }
}

// `OnStockSkusChangedEvent` (`StockSkusChangesSubscription.cs:73`).
function toStockSkusChangedEvent(changes) {
  return {
    sequenceKey: state.stockSkuSequence.key,
    sequentialId: state.stockSkuSequence.next++,
    storeId: state.robot.storeId,
    changes,
  }
}

/** Only ever a topic broadcast: OPM has no bare event for shelf status. */
export function publishSmartShelvesStatus() {
  for (const client of clientsOf("opm")) {
    for (const topic of client.topics) {
      if (topic.startsWith(SMART_SHELVES_TOPIC_PREFIX)) {
        sendInvocation(client, "OnSignalRRpcBroadcast", {
          topic,
          kind: "smartShelvesStatus",
          payload: smartShelvesStatus(topic.split("_").slice(1).join("_")),
        })
      }
    }
  }
}
