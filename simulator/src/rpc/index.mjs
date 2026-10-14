/*
 * OPM RPCs, reached through the hub's `Call(methodName, args, token)`. Each
 * file in this folder is one area and exports a `{ MethodName: handler }`
 * table; a handler takes the call's `args` array and returns the result.
 * Only names listed here answer: anything else throws, as OPM does. The
 * tables answer as OPM should once its bugs are fixed.
 */
import { runWithFaults } from "../faults.mjs"
import { state } from "../state.mjs"
import { HubException } from "./define.mjs"
import { locationMethods } from "./locations.mjs"
import { manualPnpMethods } from "./manual-pnp.mjs"
import { requestMethods } from "./requests.mjs"
import { restockingMethods } from "./restocking.mjs"
import { robotMethods } from "./robot.mjs"
import { shelfMethods } from "./shelves.mjs"
import { smartShelvesMethods } from "./smart-shelves.mjs"
import { storeMethods } from "./stores.mjs"
import { taskMethods } from "./tasks.mjs"

export const RPC_METHODS = mergeTables({
  storeMethods,
  shelfMethods,
  locationMethods,
  robotMethods,
  smartShelvesMethods,
  restockingMethods,
  requestMethods,
  manualPnpMethods,
  taskMethods,
})

// `SignalRRpcInvoker.MethodAliases`: extra names OPM answers for an existing method.
const METHOD_ALIASES = {
  GetStoreById: "GetStore",
  StartRobot: "StartRobotOperation2",
  StopRobot: "StopRobotOperation2",
  PublishManualJob: "RequestManualJob",
}

export async function callRpc(client, methodName, args, token) {
  const effectiveToken = token || client.token
  // A reload restarts the simulator but keeps the app signed in: take back its own tokens.
  if (effectiveToken?.startsWith("sim-token-")) {
    state.tokens.set(effectiveToken, effectiveToken.split("-")[2] ?? "")
  }
  if (!effectiveToken || !state.tokens.has(effectiveToken)) {
    return unauthorized()
  }

  console.debug(`OPM simulator call: ${methodName}`)
  state.commandLog.push({ method: methodName, args: structuredClone(args) })
  if (state.commandLog.length > 500) state.commandLog.shift()

  const name = METHOD_ALIASES[methodName] ?? methodName
  const handler = RPC_METHODS[name]
  if (!handler) {
    // `SignalRRpcInvoker.InvokeAsync`: a HubException the app sees as a failed call.
    throw new HubException(`Method '${methodName}' is not allowed.`)
  }
  return runWithFaults(name, handler, () => handler(args))
}

function unauthorized() {
  return {
    ok: false,
    errorCode: "Unauthorized",
    errorMessage: "Unauthorized",
  }
}

/** Joins the per-area tables, failing at startup if two define one method. */
function mergeTables(tables) {
  const merged = {}
  for (const [tableName, table] of Object.entries(tables)) {
    for (const [name, handler] of Object.entries(table)) {
      if (merged[name]) {
        throw new Error(`RPC method ${name} is defined twice (${tableName}).`)
      }
      merged[name] = handler
    }
  }
  return merged
}
