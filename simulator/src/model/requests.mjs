/*
 * Every OPM task a store can have open, whatever opened it: restocking, manual
 * replenishment, layout changes, and the store requests an operator sends.
 * OPM keeps them all in one `RequestContext` collection, so the simulator does
 * too (`state.requests`).
 */
import { state } from "../state.mjs"
import { unixSeconds } from "../utils/time.mjs"

// `Task/Entities/RequestContext.cs` `RequestType`.
export const REQUEST_TYPE = {
  annotation: 3,
  layoutCheck: 4,
  store: 10,
  shelfLayoutChange: 11,
  restocking: 12,
  manualReplenishment: 13,
}

// `Task/Entities/RequestContext.cs` `RequestStatus`.
export const REQUEST_STATUS = {
  notInProgress: 0,
  pending: 1,
  closed: 10,
  cancelled: 20,
  inProgress: 200,
}

// OPM enums arrive as names (`JsonStringEnumConverter`) or as numbers.
const REQUEST_TYPE_BY_NAME = {
  Annotation: REQUEST_TYPE.annotation,
  LayoutCheck: REQUEST_TYPE.layoutCheck,
  Store: REQUEST_TYPE.store,
  ShelfLayoutChange: REQUEST_TYPE.shelfLayoutChange,
  Restock: REQUEST_TYPE.restocking,
  ManualReplenishment: REQUEST_TYPE.manualReplenishment,
}
const REQUEST_STATUS_BY_NAME = {
  ServerInProcess: -1,
  NotInProgress: REQUEST_STATUS.notInProgress,
  Pending: REQUEST_STATUS.pending,
  Closed: REQUEST_STATUS.closed,
  Cancelled: REQUEST_STATUS.cancelled,
  InProgress: REQUEST_STATUS.inProgress,
}

/**
 * The requests a `TaskFilterOptions` selects, on store, type and status. An
 * empty or missing list selects everything, as OPM's filter does.
 * @example filterRequests({ TaskTypeFilter: ["Restock"] }) // open and closed restocks
 */
export function filterRequests(filter) {
  const storeId = filter?.TaskStoreFilter ?? filter?.taskStoreFilter
  const types = readEnumList(
    filter?.TaskTypeFilter ?? filter?.taskTypeFilter,
    REQUEST_TYPE_BY_NAME
  )
  const statuses = readEnumList(
    filter?.TaskStatusFilter ?? filter?.taskStatusFilter,
    REQUEST_STATUS_BY_NAME
  )
  return state.requests.filter(
    (request) =>
      (!storeId || request.storeId === storeId) &&
      (types.length === 0 || types.includes(Number(request.requestType))) &&
      (statuses.length === 0 || statuses.includes(Number(request.status)))
  )
}

/**
 * A `RequestStatus` sent as a name or a number; `NaN` when it is neither.
 * @example readRequestStatus("Closed") // 10
 */
export function readRequestStatus(value) {
  return readEnum(value, REQUEST_STATUS_BY_NAME)
}

function readEnumList(values, byName) {
  return (Array.isArray(values) ? values : []).map((value) =>
    readEnum(value, byName)
  )
}

function readEnum(value, byName) {
  return typeof value === "string" && value in byName
    ? byName[value]
    : Number(value)
}

/** Not closed and not cancelled, as OPM's `ActiveStoreRequestFilter` reads it. */
export function isActiveRequest(request) {
  const status = Number(request.status)
  return status !== REQUEST_STATUS.closed && status !== REQUEST_STATUS.cancelled
}

export function activeRequests() {
  return state.requests.filter(isActiveRequest)
}

/** The store's active request of one type, as `GetStoreRequestByType` finds it. */
export function findActiveRequest(requestType) {
  return activeRequests().find(
    (request) => Number(request.requestType) === requestType
  )
}

export function findRequest(requestId) {
  return state.requests.find((request) => request.requestId === requestId)
}

/**
 * Stores a new request. `fields` carries what the subtype adds on top of
 * `RequestContext`'s own fields.
 */
export function addRequest({
  requestId,
  storeId,
  requestType,
  status,
  fields,
}) {
  const now = unixSeconds()
  const request = {
    requestId,
    storeId,
    updatedAgentId: "",
    status: status ?? REQUEST_STATUS.inProgress,
    // Unix seconds (`Utility.CurrentTimeStamp`).
    updatedTime: now,
    requestType,
    assignee: null,
    dateCreated: now,
    commentList: [],
    linkedRequest: null,
    ...fields,
  }
  state.requests.push(request)
  return request
}

/** `RequestContext.SetStatus`: the status, who set it, and when. */
export function setRequestStatus(request, status, agentId = "") {
  request.status = status
  request.updatedAgentId = agentId
  request.updatedTime = unixSeconds()
  return request
}

/**
 * The next ID in a per-prefix sequence.
 * @example nextRequestId("SIM-RESTOCK") // "SIM-RESTOCK-001" on a fresh state
 */
export function nextRequestId(prefix) {
  const sequence = state.requestSequences[prefix] ?? 1
  state.requestSequences[prefix] = sequence + 1
  return `${prefix}-${String(sequence).padStart(3, "0")}`
}
