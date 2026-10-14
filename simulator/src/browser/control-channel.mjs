/*
 * The `/sim/*` scenario helpers, without a server: `requestSim()` answers in
 * the page, and the control panel (`public/sim-controls/`) reaches it from
 * another tab over a BroadcastChannel.
 */
import { SIM_ROUTES } from "../sim/index.mjs"

export const CONTROL_CHANNEL = "tx-storefront-simulator"

/** One `/sim/*` call, answered as the Node simulator's HTTP would. */
export function requestSim(method, path, params = {}) {
  if (path === "/healthz") {
    return { status: 200, body: { ok: true } }
  }
  const route = SIM_ROUTES.get(`${method.toUpperCase()} ${path}`)
  if (!route) {
    return { status: 404, body: { ok: false, error: "Not found" } }
  }
  const body = route(new URLSearchParams(params))
  return { status: body.ok === false ? 400 : 200, body }
}

/** Answers the control panel's requests from this tab. */
export function listenForControls() {
  if (typeof BroadcastChannel === "undefined") {
    return
  }
  const channel = new BroadcastChannel(CONTROL_CHANNEL)
  channel.addEventListener("message", ({ data }) => {
    if (data?.type !== "request") {
      return
    }
    let reply
    try {
      reply = requestSim(data.method, data.path, data.params)
    } catch (error) {
      reply = { status: 500, body: { ok: false, error: String(error) } }
    }
    channel.postMessage({ type: "response", id: data.id, ...reply })
  })
}
