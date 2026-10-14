import { LocationStatusType } from "../__generated__/opm-rpc"
import { call } from "../client"
import {
  createActiveStoreRequestFilters,
  readRequestContextsStrict,
  readRequestContextStrict,
  readShelfLocationsStrict,
  readSmartShelvesStatus,
} from "../schemas"

export async function getCurrentRestockingId(
  storeId: string,
  token: string
): Promise<string> {
  const result = await call("GetCurrentRestockingId2", [storeId], token)
  return String(result ?? "")
}

export async function getSmartShelvesStatus(storeId: string, token: string) {
  return readSmartShelvesStatus(
    await call("GetSmartShelvesStatus", [storeId], token)
  )
}

export function startRestocking(storeId: string, token: string) {
  return call("StartRestocking2", [storeId], token)
}

export function endRestocking(
  storeId: string,
  restockingId: string,
  token: string,
  restart = true
) {
  return call(
    restart ? "EndRestocking" : "EndRestocking2",
    [storeId, restockingId],
    token
  )
}

export function startManualReplenishment(storeId: string, token: string) {
  return call("StartManualReplenishment", [{ storeId }], token)
}

export function endManualReplenishment(
  storeId: string,
  manualReplenishmentId: string,
  token: string,
  startRobotOperationAfter = true
) {
  return call(
    "EndManualReplenishment",
    [{ storeId, manualReplenishmentId, startRobotOperationAfter }],
    token
  )
}

export async function getWorkflowRequests(storeId: string, token: string) {
  return readRequestContextsStrict(
    await call(
      "GetFilteredRequestContextsPaginated",
      [createActiveStoreRequestFilters(storeId), 0, 100],
      token
    )
  )
}

export async function getWorkflowRequest(requestId: string, token: string) {
  return readRequestContextStrict(
    await call("GetRequestById", [requestId], token)
  )
}

export async function getWorkflowStockLocations(
  storeId: string,
  token: string
) {
  return readShelfLocationsStrict(
    await call(
      "GetStockShelfLocations",
      [storeId, LocationStatusType.All],
      token
    )
  )
}
