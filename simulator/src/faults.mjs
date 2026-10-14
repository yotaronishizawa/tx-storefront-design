/*
 * Per-method faults and a global delay for the OPM hub, set from
 * `/sim/faults` and `/sim/latency`. Both live in `state`, so `/sim/reset`
 * clears them. Every OPM hub method and every `Call` RPC goes through
 * `runWithFaults`, so any of them can be made to fail.
 */
import { HubException } from "./rpc/define.mjs"
import { state } from "./state.mjs"

export const FAULT_MODES = {
  // Answers normally, carrying one of the method's own OPM error codes.
  error: "error",
  // Fails the invocation with a HubException, as OPM does for an unknown method.
  throw: "throw",
  // Never answers, so the app's own timeout has to fire.
  hang: "hang",
  // Answers with a shape no schema accepts, as a renamed OPM field would.
  unreadable: "unreadable",
  afterApplyThrow: "after-apply-throw",
  // The robot stop or restart inside the command fails with `error`.
  robot: "robot",
  // Answers `error: None` with only `errorDetail` set.
  detail: "detail",
}

/**
 * Runs `run` after the configured delay, unless `name` has a fault set.
 * `method` is the handler, which carries `fail(code)` when OPM reports
 * failures in the answer rather than by throwing.
 */
export async function runWithFaults(name, method, run) {
  if (state.latencyMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, state.latencyMs))
  }

  const fault = state.faults[name]
  if (!fault) {
    return run()
  }

  console.log(`OPM simulator fault on ${name}: ${describeFault(fault)}`)
  switch (fault.mode) {
    case FAULT_MODES.throw:
      throw new HubException(
        fault.message || `Method '${name}' is not allowed.`
      )
    case FAULT_MODES.afterApplyThrow:
      await run()
      throw new HubException("Response lost after applying the command.")
    case FAULT_MODES.hang:
      return new Promise(() => {})
    case FAULT_MODES.unreadable:
      return { simulatorUnreadable: true }
    case FAULT_MODES.robot:
      return method.failRobot(fault.error, run)
    case FAULT_MODES.detail:
      return method.failDetail()
    default:
      return method.fail(fault.error)
  }
}

export function describeFault(fault) {
  return fault.mode === FAULT_MODES.error || fault.mode === FAULT_MODES.robot
    ? `${fault.mode} ${fault.error}`
    : fault.mode === FAULT_MODES.throw && fault.message
      ? `throw "${fault.message}"`
      : fault.mode
}
