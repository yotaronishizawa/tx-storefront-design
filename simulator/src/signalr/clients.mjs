/*
 * Every open hub connection. `hub` is `"opm"` or `"shelf"`; `token` and
 * `topics` only mean something on the OPM hub. Each client brings its own
 * `send(text)` and `close()` (`browser/fake-websocket.mjs`).
 */
export const RECORD_SEPARATOR = "\x1e"

export const clients = new Set()

/** The open connections to one hub. */
export function clientsOf(hub) {
  return [...clients].filter((client) => client.hub === hub)
}

export function sendSignalR(client, message) {
  client.send(`${JSON.stringify(message)}${RECORD_SEPARATOR}`)
}

/** A server-to-client call: SignalR message type 1 with one argument. */
export function sendInvocation(client, target, payload) {
  sendSignalR(client, {
    type: 1,
    target,
    arguments: [payload],
  })
}

/** Closes every connection to one hub, as a restart or network drop would; returns how many. */
export function closeHubClients(hub) {
  const closing = clientsOf(hub)
  for (const client of closing) {
    clients.delete(client)
    client.close()
  }
  return closing.length
}
