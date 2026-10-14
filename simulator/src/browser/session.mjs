/*
 * One hub connection's SignalR JSON protocol: the handshake, then each
 * invocation answered with a completion. The transport underneath is the
 * page's fake WebSocket (`fake-websocket.mjs`).
 */
import { HUB_PATH, SHELF_HUB_PATH } from "../config.mjs"
import { invokeOpmHub } from "../hubs/opm.mjs"
import { invokeShelfHub } from "../hubs/shelf.mjs"
import { HubException } from "../rpc/define.mjs"
import { clients, RECORD_SEPARATOR, sendSignalR } from "../signalr/clients.mjs"
import { state } from "../state.mjs"
import { randomUUID } from "../utils/id.mjs"

// SignalR message types this simulator reads or writes.
const MESSAGE_TYPE = { invocation: 1, completion: 3, ping: 6 }
// Under the client's 30s server timeout.
const PING_INTERVAL_MS = 15_000

const HUBS = {
  [HUB_PATH]: { name: "opm", invoke: invokeOpmHub },
  [SHELF_HUB_PATH]: { name: "shelf", invoke: invokeShelfHub },
}

/** Whether a hub at this path would accept a connection right now. */
export function isHubUp(pathname) {
  const hub = HUBS[pathname]
  if (!hub) {
    return false
  }
  return hub.name === "opm" ? state.opmHubUp : state.shelfHubUp
}

/** Opens a connection on `pathname`, or returns `null` when that hub is down. */
export function openSession(pathname, { send, close }) {
  if (!isHubUp(pathname)) {
    return null
  }
  const hub = HUBS[pathname]
  const client = {
    handshakeComplete: false,
    id: randomUUID(),
    hub: hub.name,
    invoke: hub.invoke,
    token: "",
    topics: new Set(),
    send,
    close: () => {
      clearInterval(client.ping)
      close()
    },
  }
  client.ping = setInterval(() => {
    if (client.handshakeComplete) {
      sendSignalR(client, { type: MESSAGE_TYPE.ping })
    }
  }, PING_INTERVAL_MS)
  clients.add(client)
  return client
}

/** The app closed the connection itself. */
export function endSession(client) {
  clearInterval(client.ping)
  clients.delete(client)
}

export async function receiveText(client, text) {
  const parts = text.split(RECORD_SEPARATOR).filter(Boolean)
  for (const part of parts) {
    const message = JSON.parse(part)

    if (!client.handshakeComplete && message.protocol) {
      client.handshakeComplete = true
      sendSignalR(client, {})
      continue
    }

    if (message.type !== MESSAGE_TYPE.invocation) {
      continue
    }

    const invocationId = message.invocationId
    try {
      const result = await client.invoke(
        client,
        message.target,
        message.arguments ?? []
      )
      if (invocationId !== undefined) {
        sendSignalR(client, {
          type: MESSAGE_TYPE.completion,
          invocationId,
          result,
        })
      }
    } catch (error) {
      if (invocationId !== undefined) {
        sendSignalR(client, {
          type: MESSAGE_TYPE.completion,
          invocationId,
          error: toCompletionError(message.target, error),
        })
      }
    }
  }
}

/*
 * ASP.NET Core without `EnableDetailedErrors`, as OPM runs: a HubException's
 * message reaches the client, anything else only as a generic failure.
 */
function toCompletionError(target, error) {
  if (!(error instanceof HubException)) {
    console.error("Simulator method failed", target, error)
  }
  const generic = `An unexpected error occurred invoking '${target}' on the server.`
  return error instanceof HubException
    ? `${generic} HubException: ${error.message}`
    : generic
}
