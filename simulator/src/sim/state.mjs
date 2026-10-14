import { resetState, snapshot, state } from "../state.mjs"
import { get, post } from "./route.mjs"

export const stateRoutes = [
  get("/sim/state", () => snapshot()),

  post("/sim/reset", () => {
    resetState()
    return snapshot()
  }),
  post("/sim/auth/expire", () => {
    state.tokens.clear()
    return { ok: true }
  }),
  // A new store: OPM answers `null`, or a `null` list, until something is saved.
  post("/sim/recommendations", (params) => {
    const answer = params.get("answer") ?? "list"
    if (!["list", "null", "null-list"].includes(answer)) {
      return { ok: false, error: "answer must be list, null or null-list" }
    }
    state.recommendationsAnswer = answer
    return { ok: true, recommendationsAnswer: answer }
  }),
  // `false` makes a V2 store: OPM then leaves the shelf-mode check to the app.
  post("/sim/store/shelf-client", (params) => {
    const enabled = params.get("enabled") !== "false"
    for (const store of state.stores) {
      store.config.smartShelves.shelfClientEnabled = enabled
    }
    return { ok: true, shelfClientEnabled: enabled }
  }),
  // EAN `999` marks a cut product, which the app refuses to reserve for display.
  post("/sim/sku/ean", (params) => {
    const sku = state.skus.find((item) => item.id === params.get("sku"))
    if (!sku) {
      return { ok: false, error: `Unknown sku ${params.get("sku") ?? ""}` }
    }
    sku.eanCode = params.get("value") ?? "999"
    return { ok: true, sku: sku.id, eanCode: sku.eanCode }
  }),
  post("/sim/stores/clear", () => {
    state.stores = []
    return { ok: true, stores: state.stores.length }
  }),
]
