import { z } from "zod"

import {
  RequestStatus,
  RequestType,
  SortableColumns,
  SortOrder,
  type OpmInput,
  type TaskFilterOptions,
} from "../__generated__/opm-rpc"
import { enumName, enumNameOf, list, parse, text } from "../../shared/fields"
import { readShelfLocations } from "./shelf"

const requestContextSchema = z.looseObject({
  requestId: z.string(),
  requestType: enumName(RequestType),
  status: enumName(RequestStatus),
  storeId: text,
  // Only a layout change carries it: the display lanes as they were when it was requested.
  // Optional: a request without it (the simulator's) must not be dropped.
  initialDisplayShelfLocations: z
    .unknown()
    .optional()
    .transform(readShelfLocations),
})

export type RequestContext = z.output<typeof requestContextSchema>

/** `GetFilteredRequestContextsPaginated` answers a `(items, total)` tuple. */
const requestPageSchema = z.looseObject({
  item1: list(requestContextSchema, "request contexts"),
})

export function readRequestContexts(value: unknown): RequestContext[] {
  return parse(requestPageSchema, value, "request contexts")?.item1 ?? []
}

const workflowRequestSchema = requestContextSchema.extend({
  requestId: z.string().min(1),
  storeId: z.string().min(1),
  requestType: z
    .union([z.number(), z.string().min(1)])
    .transform((value) => enumNameOf(RequestType, value)),
  status: z
    .union([z.number(), z.string().min(1)])
    .transform((value) => enumNameOf(RequestStatus, value)),
})

/** A control decision must not mistake an unreadable request for no active work. */
export function readRequestContextStrict(value: unknown): RequestContext {
  return workflowRequestSchema.parse(value)
}

export function readRequestContextsStrict(value: unknown): RequestContext[] {
  return z.object({ item1: z.array(workflowRequestSchema) }).parse(value).item1
}

/** The requests the storefront tracks: its own open restocks, layout changes and manual replenishments. */
export function createActiveStoreRequestFilters(
  storeId: string
): OpmInput<TaskFilterOptions> {
  return {
    taskAssigneeFilter: "",
    taskStatusFilter: [
      RequestStatus.InProgress,
      RequestStatus.NotInProgress,
      RequestStatus.Pending,
      RequestStatus.ServerInProcess,
    ],
    taskTypeFilter: [
      RequestType.Restock,
      RequestType.ShelfLayoutChange,
      RequestType.ManualReplenishment,
    ],
    taskStoreFilter: storeId,
    taskStoreFilterStoreIds: [storeId],
    teleopErrorFilter: [],
    isCreatedDateFiltered: false,
    isDueDateFiltered: false,
    isStartDateFiltered: false,
    receivingTeamFilter: "",
    operatorTaskTitleFilter: "",
    sortColumn: SortableColumns.UpdatedTime,
    sortOrder: SortOrder.Descending,
  }
}
