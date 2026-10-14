/*
 * The OPM hub itself: per-method faults, a delay on every call, and the
 * connection. See `faults.mjs` for what each fault mode does.
 */
import { FAULT_MODES } from "../faults.mjs"
import { HUB_METHODS } from "../hubs/opm.mjs"
import { PNP_JOB_CONTEXT_WARNINGS } from "../rpc/errors.mjs"
import { RPC_METHODS } from "../rpc/index.mjs"
import { closeHubClients } from "../signalr/clients.mjs"
import { state } from "../state.mjs"
import { readIntParam } from "../utils/params.mjs"
import { get, post } from "./route.mjs"

/** Every method a fault can be put on: the hub's own, bar `Call`, and every RPC. */
export function faultableMethods() {
  return { ...withoutCall(HUB_METHODS), ...RPC_METHODS }
}

export const opmRoutes = [
  get("/sim/faults", () => ({ ok: true, faults: state.faults })),

  post("/sim/faults", (params) => {
    const name = params.get("method") ?? ""
    const method = faultableMethods()[name]
    if (!method) {
      return { ok: false, error: `Unknown method ${name || "(none)"}` }
    }
    const mode = params.get("mode") || FAULT_MODES.error
    if (!Object.values(FAULT_MODES).includes(mode)) {
      return { ok: false, error: `Unknown mode ${mode}` }
    }

    const fault = { mode }
    if (mode === FAULT_MODES.error) {
      if (!method.errors) {
        return {
          ok: false,
          error: `${name} has no OPM error codes; use mode throw, hang or unreadable`,
        }
      }
      const error = readIntParam(params, "error", Number.NaN)
      const known = method.errors.some(([value]) => value === error)
      if (!known || error === 0) {
        return { ok: false, error: `${name} has no error ${error}` }
      }
      fault.error = error
    }
    if (mode === FAULT_MODES.robot) {
      if (!method.robotErrors) {
        return {
          ok: false,
          error: `${name} does not stop or restart the robot`,
        }
      }
      const error = readIntParam(params, "error", Number.NaN)
      const known = method.robotErrors.some(([value]) => value === error)
      if (!known || error === 0) {
        return { ok: false, error: `${name} has no robot error ${error}` }
      }
      fault.error = error
    }
    if (mode === FAULT_MODES.detail && !method.failDetail) {
      return {
        ok: false,
        error: `${name} cannot fail with only errorDetail set`,
      }
    }
    if (mode === FAULT_MODES.throw && params.get("message")) {
      fault.message = params.get("message")
    }

    state.faults[name] = fault
    return { ok: true, faults: state.faults }
  }),
  post("/sim/faults/clear", (params) => {
    const name = params.get("method")
    if (name) {
      delete state.faults[name]
    } else {
      state.faults = {}
    }
    return { ok: true, faults: state.faults }
  }),
  post("/sim/latency", (params) => {
    state.latencyMs = Math.max(0, readIntParam(params, "ms", 0))
    return { ok: true, latencyMs: state.latencyMs }
  }),
  post("/sim/opm-hub/connection", (params) => {
    state.opmHubUp = params.get("up") !== "false"
    if (!state.opmHubUp) {
      closeHubClients("opm")
    }
    return { ok: true, opmHubUp: state.opmHubUp }
  }),
  post("/sim/opm-hub/drop", () => {
    const dropped = closeHubClients("opm")
    return { ok: true, dropped }
  }),
]

/** Manual PnP: warnings, which make the app ask for confirmation, and job progress. */
export const manualJobRoutes = [
  // Moves a published job's `PnpJobResult` on; `status` is a `JobResult.Status`
  // (3 Completed, 4 Cancelled), `errorCode` a `TeleopErrorCode`.
  post("/sim/manual-job/result", (params) => {
    const jobId = params.get("job") || Object.keys(state.manualJobs).at(-1)
    const job = state.manualJobs[jobId ?? ""]
    if (!job) {
      return { ok: false, error: `Unknown job ${jobId || "(none published)"}` }
    }
    job.result.currentStatus = readIntParam(params, "status", 3)
    job.result.errorCode = readIntParam(params, "errorCode", 0)
    return { ok: true, result: job.result }
  }),
  post("/sim/manual-job/warnings", (params) => {
    const values = (params.get("values") ?? "")
      .split(",")
      .filter((value) => value.trim() !== "")
      .map(Number)
    const unknown = values.filter(
      (value) => !(value in PNP_JOB_CONTEXT_WARNINGS)
    )
    if (unknown.length) {
      return { ok: false, error: `Unknown warning ${unknown.join(", ")}` }
    }
    state.pnpJobWarnings = values
    return { ok: true, pnpJobWarnings: state.pnpJobWarnings }
  }),
]

function withoutCall({ Call: _call, ...methods }) {
  return methods
}
