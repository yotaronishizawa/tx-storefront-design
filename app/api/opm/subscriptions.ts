import { createLogger } from "~/config/logger"
import { asRecord } from "~/utils/record"

import { isNoneEnum } from "../shared/fields"
import {
  UnsubscribeStockSkuChangesReason,
  type OpmEvents,
} from "./__generated__/opm-rpc"
import { call, opmHub } from "./client"
import { unwrapResponse } from "./errors"
import {
  readOpmRestockingSnapshot,
  readOpmStockSkuChanges,
  readSmartShelvesStatus,
  type OpmLocationState,
  type OpmStockSkuChange,
  type SmartShelvesStatus,
} from "./schemas"

const logger = createLogger("OPM SignalR")

type OpmStockSkuChangeHandlers = {
  onChange: (changes: OpmStockSkuChange[], raw: unknown) => void
  onSnapshot?: (states: OpmLocationState[], raw: unknown) => void
}

type OpmSmartShelvesStatusHandlers = {
  /** Every status tx-stock-shelf reports, several times a second. */
  onStatus: (status: SmartShelvesStatus, raw: unknown) => void
  /** Only when the store has a scanner; its latest scan is in `status.scannerStatus`. */
  onScannerStatus: (status: SmartShelvesStatus, raw: unknown) => void
}

/*
 * Each stream is a `Call` that starts it plus a SignalR topic that carries it.
 * Subscriptions stay in their map until unsubscribed, because a reconnect
 * silently drops them on the hub and `resubscribeAll` must start them again.
 */
type Subscription<Handlers> = {
  handlers: Handlers
  storeId: string
  token: string
  /** Whether OPM accepted the start call. */
  subscribed: boolean
  /** The topics the hub accepted, to unsubscribe from. */
  topics: string[]
}

let nextSubscriptionId = 1
const stockSkuSubscriptions = new Map<
  number,
  Subscription<OpmStockSkuChangeHandlers>
>()
const smartShelvesSubscriptions = new Map<
  number,
  Subscription<OpmSmartShelvesStatusHandlers>
>()

const stockSkuTopic = (storeId: string) =>
  `SubscribeToStockSkuChangesCommand_${storeId}`
const smartShelvesTopic = (storeId: string) =>
  `SubscribeToSmartShelvesStatus_${storeId}`

/** Lane changes for one store, starting with a snapshot of every lane. Returns the unsubscribe. */
export async function subscribeToStockSkuChanges(
  storeId: string,
  token: string,
  handlers: OpmStockSkuChangeHandlers
): Promise<() => Promise<void>> {
  const subscription = newSubscription(storeId, token, handlers)
  const id = await track(
    stockSkuSubscriptions,
    subscription,
    startStockSkuSubscription
  )

  return async () => {
    stockSkuSubscriptions.delete(id)
    // A stopped hub dropped it already; calling would reopen the connection.
    if (!subscription.subscribed || opmHub.isStopped) {
      return
    }
    try {
      await unsubscribeTopics(subscription)
      await call(
        "UnsubscribeToStockSkuChanges",
        [{ reason: UnsubscribeStockSkuChangesReason.Finished, storeId }],
        token
      )
    } catch {
      // Best effort: the hub drops the subscription with the connection anyway.
    }
    subscription.subscribed = false
  }
}

/** Shelf and scanner connection, and scans polled by OPM, for one store. Returns the unsubscribe. */
export async function subscribeToSmartShelvesStatus(
  storeId: string,
  token: string,
  handlers: OpmSmartShelvesStatusHandlers
): Promise<() => Promise<void>> {
  const subscription = newSubscription(storeId, token, handlers)
  const id = await track(
    smartShelvesSubscriptions,
    subscription,
    startSmartShelvesSubscription
  )

  return async () => {
    smartShelvesSubscriptions.delete(id)
    if (opmHub.isStopped) {
      return
    }
    try {
      await unsubscribeTopics(subscription)
      await call("UnsubscribeToSmartShelvesStatus", [{ storeId }], token)
    } catch (error) {
      logger.warn("OPM smart shelves status unsubscribe failed.", {
        error,
        storeId,
      })
    }
    subscription.subscribed = false
  }
}

/** A reconnect drops every subscription on the hub, so start them all again. */
async function resubscribeAll(): Promise<void> {
  for (const subscription of stockSkuSubscriptions.values()) {
    await restart(subscription, startStockSkuSubscription)
  }
  for (const subscription of smartShelvesSubscriptions.values()) {
    await restart(subscription, startSmartShelvesSubscription)
  }
}

export function stopSubscriptions(): void {
  stockSkuSubscriptions.clear()
  smartShelvesSubscriptions.clear()
}

function newSubscription<Handlers>(
  storeId: string,
  token: string,
  handlers: Handlers
): Subscription<Handlers> {
  return { handlers, storeId, token, subscribed: false, topics: [] }
}

/** Starts `subscription` and keeps it in `subscriptions`, or drops it again if the start fails. Returns its id. */
async function track<Handlers>(
  subscriptions: Map<number, Subscription<Handlers>>,
  subscription: Subscription<Handlers>,
  start: (subscription: Subscription<Handlers>) => Promise<void>
): Promise<number> {
  const id = nextSubscriptionId++
  subscriptions.set(id, subscription)
  try {
    await start(subscription)
  } catch (error) {
    subscriptions.delete(id)
    throw error
  }
  return id
}

async function restart<Handlers>(
  subscription: Subscription<Handlers>,
  start: (subscription: Subscription<Handlers>) => Promise<void>
) {
  try {
    await start(subscription)
  } catch (error) {
    logger.warn("Failed to resubscribe to an OPM stream.", error)
    subscription.subscribed = false
  }
}

async function startStockSkuSubscription(
  subscription: Subscription<OpmStockSkuChangeHandlers>
): Promise<void> {
  const { storeId, token } = subscription
  const result = await call("SubscribeToStockSkuChanges", [{ storeId }], token)
  throwOnResponseError("SubscribeToStockSkuChanges", result)

  const snapshot = readOpmRestockingSnapshot(result)
  logger.debug("SubscribeToStockSkuChanges snapshot", {
    storeId,
    locationIds: snapshot.map(({ locationId }) => locationId),
  })
  if (snapshot.length > 0) {
    subscription.handlers.onSnapshot?.(snapshot, result)
  }

  await subscribeTopic(subscription, stockSkuTopic(storeId))
  subscription.subscribed = true
}

async function startSmartShelvesSubscription(
  subscription: Subscription<OpmSmartShelvesStatusHandlers>
): Promise<void> {
  const { storeId, token } = subscription
  const result = await call(
    "SubscribeToSmartShelvesStatus",
    [{ storeId }],
    token
  )
  throwOnResponseError("SubscribeToSmartShelvesStatus", result)

  await subscribeTopic(subscription, smartShelvesTopic(storeId))
  subscription.subscribed = true
}

/** A topic the hub refuses is logged, not thrown: the start call's answer already came back. */
async function subscribeTopic<Handlers>(
  subscription: Subscription<Handlers>,
  topic: string
): Promise<void> {
  subscription.topics = []
  try {
    await opmHub.invoke("Subscribe", topic, subscription.token)
    subscription.topics.push(topic)
    opmHub.log("SUBSCRIBE", topic, { storeId: subscription.storeId })
  } catch (error) {
    logger.warn("OPM SignalR topic subscription is unavailable.", {
      error,
      topic,
    })
  }
}

async function unsubscribeTopics<Handlers>(
  subscription: Subscription<Handlers>
): Promise<void> {
  for (const topic of subscription.topics) {
    try {
      await opmHub.invokeIfOpen("Unsubscribe", topic, subscription.token)
      opmHub.log("UNSUBSCRIBE", topic, { storeId: subscription.storeId })
    } catch {
      // Best effort: the hub drops topics with the connection anyway.
    }
  }
  subscription.topics = []
}

/**
 * A subscribe answer carries its refusal as an `error` or `errorCode` enum, or,
 * for `SubscribeToSmartShelvesStatus`, which has no error enum, as `success: false`.
 */
function throwOnResponseError(methodName: string, result: unknown): void {
  const { error, errorCode, success } = asRecord(unwrapResponse(result))
  const value = error ?? errorCode
  const hasErrorEnum = !isNoneEnum(value) && typeof value !== "object"
  if (hasErrorEnum) {
    throw new Error(`${methodName} failed: ${String(value)}`)
  }
  if (success === false) {
    throw new Error(`${methodName} failed`)
  }
}

/** OPM's `OnStockSkusChanged`, pushed directly or relayed as a broadcast. */
function handleOpmStockSkuChanges(
  eventName: string,
  ...payloads: unknown[]
): void {
  const payload = payloads.length === 1 ? payloads[0] : payloads
  opmHub.log("EVENT", eventName, payload)
  const changes = readOpmStockSkuChanges(payload)
  if (changes.length === 0) {
    return
  }

  const storeId = String(asRecord(payload).storeId ?? "")
  for (const subscription of stockSkuSubscriptions.values()) {
    if (!storeId || storeId === subscription.storeId) {
      subscription.handlers.onChange(changes, payload)
    }
  }
}

function handleOpmSmartShelvesStatus(source: string, payload: unknown): void {
  opmHub.log("EVENT", source, payload)
  const status = readSmartShelvesStatus(payload)
  if (!status) {
    return
  }

  // tx-stock-shelf sends no `scannerStatus` while the scanner is unplugged.
  const scanner = status.scannerStatus
  for (const { handlers, storeId } of smartShelvesSubscriptions.values()) {
    if (status.storeId && status.storeId !== storeId) {
      continue
    }
    handlers.onStatus(status, payload)
    if (scanner) {
      handlers.onScannerStatus(status, payload)
    }
  }
}

/** OPM's `OnSignalRRpcBroadcast` (`{ topic, kind, payload }`), dispatched once per topic; handlers fan out themselves. */
function handleOpmBroadcast(message: unknown): void {
  const { topic, kind, payload } = asRecord(message)
  const source = `OnSignalRRpcBroadcast:${String(kind || topic || "unknown")}`
  if (!topic || kind === "subscribed") {
    opmHub.log("EVENT", source, message)
    return
  }

  const isStockSku = isSubscribedTo(topic, stockSkuSubscriptions, stockSkuTopic)
  const isSmartShelves = isSubscribedTo(
    topic,
    smartShelvesSubscriptions,
    smartShelvesTopic
  )
  if (isStockSku) {
    handleOpmStockSkuChanges(source, payload)
  }
  if (isSmartShelves) {
    handleOpmSmartShelvesStatus(source, payload)
  }
  if (!isStockSku && !isSmartShelves) {
    opmHub.log("EVENT", source, message)
  }
}

function isSubscribedTo(
  topic: unknown,
  subscriptions: Map<number, Subscription<unknown>>,
  topicOf: (storeId: string) => string
): boolean {
  for (const { storeId } of subscriptions.values()) {
    if (topicOf(storeId) === topic) {
      return true
    }
  }
  return false
}

opmHub.on("OnStockSkusChanged" satisfies keyof OpmEvents, (...payloads) =>
  handleOpmStockSkuChanges("OnStockSkusChanged", ...payloads)
)
opmHub.on("OnSignalRRpcBroadcast", handleOpmBroadcast)
opmHub.onRestored(resubscribeAll)
