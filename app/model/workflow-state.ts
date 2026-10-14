import { type RequestContext } from "~/api/opm/schemas"

import { isActiveRequest } from "./request-state"

export type WorkflowMode = "Restock" | "ManualReplenishment"
export type WorkflowStartDecision = "start" | "resume" | "existing" | "blocked"

/** Pending is paused RS in OPM; ServerInProcess is never an operator pause. */
export function getRestockingPhase(request?: RequestContext) {
  if (!isActiveRequest(request)) return "ready"
  switch (request!.status) {
    case "NotInProgress":
      return "ready"
    case "Pending":
      return "paused"
    case "InProgress":
      return "active"
    case "ServerInProcess":
      return "preparing"
    default:
      return "unknown"
  }
}

/** No robot command is allowed before the other workflow is known to be closed. */
export function getWorkflowStartDecision(
  requests: RequestContext[],
  mode: WorkflowMode
): WorkflowStartDecision {
  const current = getExclusiveWorkflowRequest(requests, mode)
  if (current === false) return "blocked"
  if (!current) return "start"
  const status = current.status
  if (status === "InProgress") return "existing"
  if (status === "Pending") return "resume"
  if (status === "NotInProgress") return mode === "Restock" ? "start" : "resume"
  return "blocked"
}

/** Both End commands accept InProgress and Pending, but not NotInProgress. */
export function getEndableWorkflowRequest(
  requests: RequestContext[],
  mode: WorkflowMode
): RequestContext | undefined {
  const current = getExclusiveWorkflowRequest(requests, mode)
  if (!current) return undefined
  const status = current.status
  return status === "InProgress" || status === "Pending" ? current : undefined
}

function getExclusiveWorkflowRequest(
  requests: RequestContext[],
  mode: WorkflowMode
): RequestContext | undefined | false {
  const opposite = mode === "Restock" ? "ManualReplenishment" : "Restock"
  const active = requests.filter(isActiveRequest)
  if (active.some((request) => request.requestType === opposite)) return false
  const matching = active.filter((request) => request.requestType === mode)
  return matching.length > 1 ? false : matching[0]
}
