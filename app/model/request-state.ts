import type { RequestContext } from "~/api/opm/schemas"

/** Open, as opposed to merely present: a closed task must not prompt again. */
export function isActiveRequest(request: RequestContext | undefined) {
  return (
    request !== undefined &&
    request.status !== "Closed" &&
    request.status !== "Cancelled"
  )
}

export function isRequestInProgress(request: RequestContext | undefined) {
  return request?.status === "InProgress"
}
