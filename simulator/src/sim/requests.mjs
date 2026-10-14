/*
 * Requests the store does not open itself: an operator's store request, or a
 * layout check or annotation task that blocks cancelling a layout change.
 */
import {
  addRequest,
  nextRequestId,
  REQUEST_STATUS,
  REQUEST_TYPE,
} from "../model/requests.mjs"
import { snapshot, state } from "../state.mjs"
import { readIntParam } from "../utils/params.mjs"
import { post } from "./route.mjs"

// Only a store request carries a title and description (`StoreRequest`).
const OPENABLE_TYPES = new Set([
  REQUEST_TYPE.annotation,
  REQUEST_TYPE.layoutCheck,
  REQUEST_TYPE.store,
])

export const requestRoutes = [
  post("/sim/request", (params) => {
    const requestType = readIntParam(params, "type", REQUEST_TYPE.store)
    if (!OPENABLE_TYPES.has(requestType)) {
      return { ok: false, error: `Request type ${requestType} is not openable` }
    }
    const request = addRequest({
      requestId: nextRequestId(`SIM-REQUEST-${requestType}`),
      storeId: state.robot.storeId,
      requestType,
      status: readIntParam(params, "status", REQUEST_STATUS.notInProgress),
      fields:
        requestType === REQUEST_TYPE.store
          ? {
              title: params.get("title") || "Check the fridge door",
              description: params.get("description") || "",
            }
          : {},
    })
    return { ...snapshot(), ok: true, request }
  }),
]
