import { OPM_SIGNALR_URL } from "~/config/env"
import { createLogger } from "~/config/logger"

import { HubClient } from "../shared/hub-client"
import type { OpmRpcArgs, OpmRpcMethodName } from "./__generated__/opm-rpc"
import {
  isConnectionStateError,
  isUnauthorizedError,
  isUnauthorizedResult,
} from "./errors"

/** The one OPM connection; nothing connects at import, so the build's prerender can load this in Node. */
export const opmHub = new HubClient({
  negotiationFallback: true,
  scope: "OPM SignalR",
  url: OPM_SIGNALR_URL,
})

let tokenRefreshHandler: ((token: string) => Promise<string | null>) | null =
  null

/** How a SignalR `Unauthorized` gets a fresh token; `null` to remove it. */
export function setTokenRefreshHandler(
  handler: ((token: string) => Promise<string | null>) | null
): void {
  tokenRefreshHandler = handler
}

/** Calls `listener` each time the hub comes back after dropping; returns the unsubscribe. */
export function onReconnected(listener: () => void): () => void {
  return opmHub.onRestored(listener)
}

/** Called now and on every change of the hub's connected flag; returns the unsubscribe. */
export function onOpmConnectionChange(
  listener: (connected: boolean) => void
): () => void {
  return opmHub.onConnectionChange(listener)
}

/** Drops the connection for a fresh one: the operator's manual reconnect. */
export function reconnectOpm(): Promise<void> {
  return opmHub.restart()
}

/** Whether the hub is connected now; a poll skips its tick while it is not, or the call would restart it. */
export function isOpmConnected(): boolean {
  return opmHub.isConnected
}

/** Closed on purpose (sign-out), so its disconnect is not a lost connection. */
export function isOpmStopped(): boolean {
  return opmHub.isStopped
}

/** Opens the connection, or waits for the one being opened. */
export function ensureConnection(): Promise<void> {
  return opmHub.start()
}

/** One OPM method through the hub's `Call`, typed by the generated contract; the result is `unknown` until a schema reads it. */
export async function call<M extends OpmRpcMethodName>(
  methodName: M,
  args: OpmRpcArgs<M>,
  token: string
): Promise<unknown> {
  // A mapped tuple is an array, but TypeScript cannot see that for a generic `M`.
  return opmHub.traced(methodName, args, () =>
    callWithTokenRefresh(methodName, args as unknown[], token)
  )
}

/** The first of `methodNames` this OPM has that answers; for methods OPM renamed. */
export async function callAny<M extends OpmRpcMethodName>(
  methodNames: readonly M[],
  args: OpmRpcArgs<M>,
  token: string
): Promise<unknown> {
  let lastError: unknown

  for (const methodName of methodNames) {
    try {
      const result = await call(methodName, args, token)
      if (result !== null) {
        return result
      }
    } catch (error) {
      if (isUnauthorizedError(error)) {
        throw error
      }
      lastError = error
    }
  }

  if (lastError) {
    throw lastError instanceof Error ? lastError : new Error(String(lastError))
  }
  return null
}

const logger = createLogger("OPM")

/** `Call`, retried once with a fresh token if the hub answers `Unauthorized`. */
async function callWithTokenRefresh(
  methodName: string,
  args: unknown[],
  token: string
): Promise<unknown> {
  const result = await invokeCall(methodName, args, token)
  if (!isUnauthorizedResult(result)) {
    return result
  }

  const nextToken = await tokenRefreshHandler?.(token)
  if (nextToken) {
    const retryResult = await invokeCall(methodName, args, nextToken)
    if (!isUnauthorizedResult(retryResult)) {
      return retryResult
    }
    logger.error(`${methodName} refused a freshly issued token.`)
  }
  throw new Error("Unauthorized")
}

/** `Call`, retried once on a fresh connection if the open one turns out to be dead. */
async function invokeCall(
  methodName: string,
  args: unknown[],
  token: string
): Promise<unknown> {
  try {
    return await opmHub.invoke("Call", methodName, args, token)
  } catch (error) {
    if (!isConnectionStateError(error)) {
      throw error
    }
    await opmHub.restart()
    return opmHub.invoke("Call", methodName, args, token)
  }
}
