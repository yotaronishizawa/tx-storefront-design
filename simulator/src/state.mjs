import { createState } from "./seed/index.mjs"

/**
 * The one mutable simulator state. Everything imports this object and mutates
 * it in place; `resetState()` swaps its contents, never the reference.
 */
export const state = createState()

export function resetState() {
  const next = createState()
  for (const key of Object.keys(state)) {
    delete state[key]
  }
  Object.assign(state, next)
}

/** The summary `/sim/state` and most other `/sim/*` helpers answer with. */
export function snapshot() {
  return {
    stores: state.stores.length,
    skus: state.skus.length,
    displayLocations: state.displayLocations.length,
    stockLocations: state.stockLocations.length,
    requests: state.requests,
    robot: state.robot,
    curtainsOpen: state.curtainsOpen,
    commandLog: state.commandLog,
    currentRestockingId: state.currentRestockingId,
    currentRestockingSku: state.currentRestockingSku,
    faults: state.faults,
    latencyMs: state.latencyMs,
    pnpJobWarnings: state.pnpJobWarnings,
    notifications: state.notifications,
    storeTasks: state.storeTasks,
    operatorTasks: state.operatorTasks,
    unfixableLaneIds: state.unfixableLaneIds,
    shelfConnected: state.shelfConnected,
    scannerPresent: state.scannerPresent,
    scannerConnected: state.scannerConnected,
    opmHubUp: state.opmHubUp,
    shelfHubUp: state.shelfHubUp,
  }
}
