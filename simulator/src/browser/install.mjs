/*
 * Runs the whole simulator inside the app's page, so the app needs no
 * backend: imported first by `app/entry.client.tsx`. It routes the hub URLs
 * on `sim.invalid` (`.env.mock`) to the simulator, answers the control panel,
 * and pushes shelf status as tx-stock-shelf does.
 *
 * Reloading the page restarts the simulator from its seed.
 */
import { publishSmartShelvesStatus } from "../events.mjs"
import { listenForControls, requestSim } from "./control-channel.mjs"
import { FakeWebSocket, SIM_HOST } from "./fake-websocket.mjs"
import { isHubUp } from "./session.mjs"

// tx-stock-shelf reports its status several times a second, and OPM relays each one.
const SMART_SHELVES_REPORT_INTERVAL_MS = 1000

const isSimUrl = (url) => {
  try {
    return new URL(String(url), location.href).hostname === SIM_HOST
  } catch {
    return false
  }
}

const RealWebSocket = globalThis.WebSocket
globalThis.WebSocket = new Proxy(RealWebSocket, {
  construct(target, args) {
    return isSimUrl(args[0])
      ? new FakeWebSocket(args[0])
      : Reflect.construct(target, args)
  },
})

// SignalR's negotiate request, as the Node simulator answered it.
const realFetch = globalThis.fetch.bind(globalThis)
globalThis.fetch = (input, init) => {
  const url = input instanceof Request ? input.url : input
  if (!isSimUrl(url)) {
    return realFetch(input, init)
  }
  const { pathname } = new URL(String(url))
  const hubPath = pathname.replace(/\/negotiate$/, "")
  if (!pathname.endsWith("/negotiate") || !isHubUp(hubPath)) {
    return Promise.resolve(
      Response.json({ ok: false, error: "Hub is down" }, { status: 503 })
    )
  }
  return Promise.resolve(
    Response.json({
      connectionId: crypto.randomUUID(),
      connectionToken: crypto.randomUUID(),
      negotiateVersion: 1,
      availableTransports: [
        { transport: "WebSockets", transferFormats: ["Text"] },
      ],
    })
  )
}

setInterval(publishSmartShelvesStatus, SMART_SHELVES_REPORT_INTERVAL_MS)
listenForControls()

// From the browser console: `sim("POST", "/sim/lane/add", { lane: "S1-R1-L01", sku: "SIM-TEA" })`.
globalThis.sim = (method, path, params) => requestSim(method, path, params).body
