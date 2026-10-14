import {
  findActiveRequest,
  REQUEST_STATUS,
  REQUEST_TYPE,
  setRequestStatus,
} from "../model/requests.mjs"
import { snapshot, state } from "../state.mjs"
import { get, post } from "./route.mjs"

export const workflowRoutes = [
  get("/sim/layout", () => ({ locations: state.displayLocations })),
  post("/sim/layout/outcome", (params) => {
    const value = params.get("value") ?? "apply"
    if (
      ![
        "apply",
        "reject",
        "unreadable",
        "defer",
        "allocation-error",
        "apply-warning",
      ].includes(value)
    )
      return { ok: false, error: "Unknown layout outcome" }
    state.layoutOutcome = value
    return { ok: true, value }
  }),
  post("/sim/layout/apply-pending", () => {
    if (state.pendingDisplayLocations) {
      state.displayHistoryLocations = structuredClone(state.displayLocations)
      state.displayLocations = state.pendingDisplayLocations
      state.pendingDisplayLocations = null
    }
    return { ok: true }
  }),
  post("/sim/manual/end-outcome", (params) => {
    const value = params.get("value") ?? "success"
    if (!["success", "unstable", "curtain-failure"].includes(value))
      return { ok: false, error: "Unknown manual outcome" }
    state.manualEndOutcome = value
    return { ok: true, value }
  }),
  // External operator/state fixture: mutate an existing task, never create one.
  post("/sim/workflow/request-status", (params) => {
    const type = Number(params.get("type"))
    const status = Number(params.get("status"))
    if (
      ![REQUEST_TYPE.restocking, REQUEST_TYPE.manualReplenishment].includes(
        type
      ) ||
      ![-1, ...Object.values(REQUEST_STATUS)].includes(status)
    )
      return { ok: false, error: "Invalid workflow type or status" }
    const request = findActiveRequest(type)
    if (!request) return { ok: false, error: "No active workflow" }
    setRequestStatus(request, status)
    if (
      type === REQUEST_TYPE.restocking &&
      [REQUEST_STATUS.closed, REQUEST_STATUS.cancelled].includes(status)
    ) {
      state.currentRestockingId = ""
      state.currentRestockingSku = ""
    }
    return { ok: true, request }
  }),
  post("/sim/workflow/restart-error", (params) => {
    const error = Number(params.get("value") ?? 0)
    if (!Number.isInteger(error) || error < 0 || error > 13)
      return { ok: false, error: "Invalid restart error" }
    state.restartError = error
    return { ok: true, error }
  }),
  // Explicit annotation outcome fixture. It confirms no physical capture or placement.
  post("/sim/capture/complete", () => {
    const request = findActiveRequest(REQUEST_TYPE.shelfLayoutChange)
    if (!request?.captureJobPublished)
      return { ok: false, error: "No pending capture" }
    setRequestStatus(request, REQUEST_STATUS.closed)
    state.robot.status = 5
    state.robot.opMode = 31
    return snapshot()
  }),
]
